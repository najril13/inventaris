import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/auth";

type Params = { params: Promise<{ id: string }> };

// GET /api/transaksi/[id] - Detail transaksi
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Silakan login terlebih dahulu" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const transaksi = await prisma.transaksi.findUnique({
      where: { id },
      include: {
        pengguna: {
          select: { id: true, nama: true, email: true, role: true },
        },
        unit: true,
        barang: {
          include: { kategori: true },
        },
      },
    });

    if (!transaksi) {
      return NextResponse.json(
        { error: "Transaksi tidak ditemukan" },
        { status: 404 },
      );
    }

    // Pastikan user biasa hanya bisa melihat transaksi miliknya
    if (session.role === "User" && transaksi.penggunaId !== session.id) {
      return NextResponse.json(
        { error: "Anda tidak berhak melihat transaksi ini" },
        { status: 403 },
      );
    }

    return NextResponse.json({ data: transaksi }, { status: 200 });
  } catch (error) {
    console.error("Error fetching detail transaksi:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}

// PATCH /api/transaksi/[id] - Update status atau data transaksi
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Silakan login terlebih dahulu" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const {
      status: newStatus,
      tenggatWaktu,
      catatan,
      keperluan,
      unitId: assignUnitId,
      kondisiKembali,
    } = body;

    const existing = await prisma.transaksi.findUnique({
      where: { id },
      include: { barang: true, unit: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Transaksi tidak ditemukan" },
        { status: 404 },
      );
    }

    // Validasi izin akses
    const isOwner = existing.penggunaId === session.id;
    const isAdmin = session.role === "Admin" || session.role === "Petugas";

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: "Akses ditolak" },
        { status: 403 },
      );
    }

    const oldStatus = existing.status;

    // Aturan otorisasi:
    // 1. User biasa (peminjam):
    //    - Boleh membatalkan ("DIBATALKAN") jika permohonan masih MENUNGGU.
    //    - Boleh mengembalikan ("DIKEMBALIKAN") jika barang sedang DIPINJAM atau TERLAMBAT.
    if (!isAdmin && isOwner && newStatus) {
      if (newStatus === "DIBATALKAN") {
        if (oldStatus !== "MENUNGGU") {
          return NextResponse.json(
            { error: "Hanya permohonan yang masih menunggu persetujuan yang dapat dibatalkan" },
            { status: 400 },
          );
        }
      } else if (newStatus === "DIKEMBALIKAN") {
        if (oldStatus !== "DIPINJAM" && oldStatus !== "TERLAMBAT") {
          return NextResponse.json(
            { error: "Hanya barang yang sedang dipinjam yang dapat dikembalikan" },
            { status: 400 },
          );
        }
      } else {
        return NextResponse.json(
          { error: "Pengguna hanya dapat membatalkan permohonan atau mengembalikan barang" },
          { status: 403 },
        );
      }
    }

    // 2. Petugas / Admin:
    //    - Pengembalian barang saat dipinjam HANYA boleh dilakukan oleh user yang meminjam.
    //    - Petugas / Admin hanya menyetujui ("DIPINJAM") atau menolak ("DITOLAK") saat status MENUNGGU.
    if (isAdmin && !isOwner && newStatus === "DIKEMBALIKAN") {
      return NextResponse.json(
        { error: "Pengembalian barang hanya dapat dilakukan oleh pengguna yang meminjam" },
        { status: 403 },
      );
    }

    // Transaksi database atomic jika ada perubahan status yang berdampak pada unit & stok
    const updated = await prisma.$transaction(async (tx) => {
      const updateData: {
        status?: string;
        unitId?: string | null;
        tenggatWaktu?: Date;
        catatan?: string | null;
        keperluan?: string | null;
        tanggalKembali?: Date | null;
      } = {};

      if (tenggatWaktu) updateData.tenggatWaktu = new Date(tenggatWaktu);
      if (catatan !== undefined) updateData.catatan = catatan;
      if (keperluan !== undefined) updateData.keperluan = keperluan;

      if (newStatus && newStatus !== oldStatus) {
        updateData.status = newStatus;

        // 1. Pengembalian barang (DIPINJAM / TERLAMBAT -> DIKEMBALIKAN)
        if (
          (oldStatus === "DIPINJAM" || oldStatus === "TERLAMBAT") &&
          newStatus === "DIKEMBALIKAN"
        ) {
          updateData.tanggalKembali = new Date();

          if (existing.unitId) {
            await tx.unitBarang.update({
              where: { id: existing.unitId },
              data: {
                status: "TERSEDIA",
                kondisi: kondisiKembali || existing.unit?.kondisi || "BAIK",
              },
            });
          }

          // Setiap barang adalah 1 unit fisik: saat dikembalikan, stok = 1, status = TERSEDIA
          await tx.barang.update({
            where: { id: existing.barangId },
            data: {
              stok: 1,
              status: "TERSEDIA",
            },
          });
        }

        // 2. Persetujuan peminjaman (MENUNGGU -> DIPINJAM)
        if (oldStatus === "MENUNGGU" && newStatus === "DIPINJAM") {
          // Periksa apakah barang sedang dipinjam oleh user lain
          const activeLoan = await tx.transaksi.findFirst({
            where: {
              id: { not: id },
              barangId: existing.barangId,
              status: { in: ["DIPINJAM", "TERLAMBAT"] },
            },
            include: {
              pengguna: {
                select: { nama: true },
              },
            },
          });

          if (activeLoan) {
            throw new Error(
              `Barang ini sedang dipinjam oleh ${activeLoan.pengguna.nama}. Anda harus menunggu barang selesai dipinjam dan dikembalikan terlebih dahulu.`
            );
          }

          // Cari unit fisik jika ada
          let chosenUnitId = assignUnitId || existing.unitId;

          if (chosenUnitId) {
            const checkUnit = await tx.unitBarang.findUnique({
              where: { id: chosenUnitId },
            });
            if (!checkUnit || checkUnit.status !== "TERSEDIA") {
              chosenUnitId = null;
            }
          }

          if (!chosenUnitId) {
            const availableUnit = await tx.unitBarang.findFirst({
              where: { barangId: existing.barangId, status: "TERSEDIA" },
            });
            if (availableUnit) {
              chosenUnitId = availableUnit.id;
            }
          }

          // Jika ada unit fisik terdaftar, update statusnya ke DIPINJAM
          if (chosenUnitId) {
            updateData.unitId = chosenUnitId;
            await tx.unitBarang.update({
              where: { id: chosenUnitId },
              data: { status: "DIPINJAM" },
            });
          }

          // Konsep: setiap barang hanya 1 unit. Ketika dipinjam: stok = 0, status = DIPINJAM
          await tx.barang.update({
            where: { id: existing.barangId },
            data: {
              stok: 0,
              status: "DIPINJAM",
            },
          });
        }

        // 3. Penolakan peminjaman (MENUNGGU -> DITOLAK)
        if (oldStatus === "MENUNGGU" && newStatus === "DITOLAK") {
          // Pastikan barang tetap TERSEDIA dengan stok 1
          await tx.barang.update({
            where: { id: existing.barangId },
            data: {
              stok: 1,
              status: "TERSEDIA",
            },
          });

          if (existing.unitId) {
            await tx.unitBarang.update({
              where: { id: existing.unitId },
              data: { status: "TERSEDIA" },
            });
          }
        }

        // 4. Pembatalan saat barang sudah dipinjam (DIPINJAM -> DIBATALKAN)
        if (oldStatus === "DIPINJAM" && newStatus === "DIBATALKAN") {
          if (existing.unitId) {
            await tx.unitBarang.update({
              where: { id: existing.unitId },
              data: { status: "TERSEDIA" },
            });
          }

          await tx.barang.update({
            where: { id: existing.barangId },
            data: {
              stok: 1,
              status: "TERSEDIA",
            },
          });
        }
      }

      const res = await tx.transaksi.update({
        where: { id },
        data: updateData,
        include: {
          pengguna: {
            select: { id: true, nama: true, email: true },
          },
          unit: true,
          barang: true,
        },
      });

      return res;
    });

    return NextResponse.json(
      { message: "Transaksi berhasil diperbarui", data: updated },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating transaksi:", error);
    const msg = error instanceof Error ? error.message : "Terjadi kesalahan pada server";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/transaksi/[id] - Hapus catatan transaksi (Hanya Admin)
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    if (!session || session.role !== "Admin") {
      return NextResponse.json(
        { error: "Hanya Admin yang berwenang menghapus transaksi" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const existing = await prisma.transaksi.findUnique({
      where: { id },
      include: { barang: true, unit: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Transaksi tidak ditemukan" },
        { status: 404 },
      );
    }

    await prisma.$transaction(async (tx) => {
      // Jika statusnya masih DIPINJAM, kembalikan unit fisik dan barang ke TERSEDIA
      if (existing.status === "DIPINJAM" || existing.status === "TERLAMBAT") {
        if (existing.unitId) {
          await tx.unitBarang.update({
            where: { id: existing.unitId },
            data: { status: "TERSEDIA" },
          });
        }

        await tx.barang.update({
          where: { id: existing.barangId },
          data: {
            stok: 1,
            status: "TERSEDIA",
          },
        });
      }

      await tx.transaksi.delete({
        where: { id },
      });
    });

    return NextResponse.json(
      { message: "Catatan transaksi berhasil dihapus" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting transaksi:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}
