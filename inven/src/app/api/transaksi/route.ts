import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/auth";

// GET /api/transaksi - Ambil daftar transaksi peminjaman
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Sesi tidak valid atau telah berakhir" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const query = searchParams.get("q");

    // Jika user biasa, hanya tampilkan transaksi miliknya sendiri
    const isUserRole = session.role === "User";

    const whereClause: Record<string, unknown> = {};

    if (isUserRole) {
      whereClause.penggunaId = session.id;
    }

    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    if (query) {
      whereClause.OR = [
        { kodeTransaksi: { contains: query } },
        { barang: { nama: { contains: query } } },
        { unit: { serialNumber: { contains: query } } },
        { pengguna: { nama: { contains: query } } },
      ];
    }

    const transaksiList = await prisma.transaksi.findMany({
      where: whereClause,
      include: {
        pengguna: {
          select: {
            id: true,
            nama: true,
            email: true,
            role: true,
          },
        },
        unit: true,
        barang: {
          include: {
            kategori: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: transaksiList }, { status: 200 });
  } catch (error) {
    console.error("Error fetching transaksi:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}

// POST /api/transaksi - Catat / ajukan peminjaman baru
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Silakan login terlebih dahulu" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const {
      barangId,
      unitId,
      tanggalPinjam,
      tenggatWaktu,
      keperluan,
      catatan,
      status: requestedStatus,
    } = body;

    let targetPenggunaId = body.penggunaId;

    // Jika user biasa yang submit, otomatis pakai ID akun dia sendiri
    if (session.role === "User") {
      targetPenggunaId = session.id;
    } else if (!targetPenggunaId) {
      targetPenggunaId = session.id;
    }

    if (!barangId) {
      return NextResponse.json(
        { error: "Barang wajib dipilih" },
        { status: 400 },
      );
    }

    if (!tenggatWaktu) {
      return NextResponse.json(
        { error: "Tenggat waktu pengembalian wajib diisi" },
        { status: 400 },
      );
    }

    // Periksa apakah barang terdaftar
    const barang = await prisma.barang.findUnique({
      where: { id: barangId },
      include: {
        units: {
          where: { status: "TERSEDIA" },
        },
      },
    });

    if (!barang) {
      return NextResponse.json(
        { error: "Barang tidak ditemukan" },
        { status: 404 },
      );
    }

    // KUNCI UTAMA: Setiap barang adalah 1 unit fisik.
    // Jika barang sedang dipinjam atau sedang dalam permohonan pinjaman oleh user lain,
    // user berikutnya HARUS menunggu sampai barang selesai dipinjam dan dikembalikan.
    const activeTx = await prisma.transaksi.findFirst({
      where: {
        barangId,
        status: { in: ["DIPINJAM", "TERLAMBAT", "MENUNGGU"] },
      },
      include: {
        pengguna: {
          select: { id: true, nama: true },
        },
      },
    });

    if (activeTx) {
      if (activeTx.status === "MENUNGGU") {
        return NextResponse.json(
          {
            error: `Barang ini sedang dalam proses permohonan pinjaman oleh ${activeTx.pengguna.nama}. Anda harus menunggu hingga permohonan selesai diproses atau pilih barang lain.`,
          },
          { status: 400 },
        );
      }
      return NextResponse.json(
        {
          error: `Barang ini sedang dipinjam oleh ${activeTx.pengguna.nama}. Anda harus menunggu barang selesai dipinjam dan dikembalikan terlebih dahulu.`,
        },
        { status: 400 },
      );
    }

    if (barang.status === "DIPINJAM" || barang.stok <= 0) {
      return NextResponse.json(
        {
          error: "Barang ini sedang dipinjam oleh pengguna lain. Silakan tunggu hingga barang selesai dipinjam dan dikembalikan.",
        },
        { status: 400 },
      );
    }

    // Ambil unit fisik jika ada
    let targetUnitId: string | null = null;
    if (unitId) {
      const selectedUnit = await prisma.unitBarang.findUnique({
        where: { id: unitId },
      });
      if (
        selectedUnit &&
        selectedUnit.barangId === barangId &&
        selectedUnit.status === "TERSEDIA"
      ) {
        targetUnitId = selectedUnit.id;
      }
    } else if (barang.units.length > 0) {
      targetUnitId = barang.units[0].id;
    }

    // Tentukan status awal transaksi:
    // Jika User biasa yang mengajukan -> MENUNGGU (perlu persetujuan Admin atau Petugas)
    // Jika Admin membuat langsung -> default DIPINJAM
    let statusTransaksi = session.role === "User" ? "MENUNGGU" : "DIPINJAM";
    if (requestedStatus && session.role === "Admin") {
      statusTransaksi = requestedStatus;
    }

    // Generate kode transaksi berurutan: TRX-0001
    const totalTransaksi = await prisma.transaksi.count();
    const nextCode = `TRX-${String(totalTransaksi + 1).padStart(4, "0")}`;

    const startDate = tanggalPinjam ? new Date(tanggalPinjam) : new Date();
    const dueDate = new Date(tenggatWaktu);

    const result = await prisma.$transaction(async (tx) => {
      // Jika statusnya langsung DIPINJAM (misal dibuat langsung oleh Admin):
      if (statusTransaksi === "DIPINJAM") {
        if (targetUnitId) {
          await tx.unitBarang.update({
            where: { id: targetUnitId },
            data: { status: "DIPINJAM" },
          });
        }

        await tx.barang.update({
          where: { id: barangId },
          data: {
            stok: 0,
            status: "DIPINJAM",
          },
        });
      }

      const transaksi = await tx.transaksi.create({
        data: {
          kodeTransaksi: nextCode,
          penggunaId: targetPenggunaId,
          barangId,
          unitId: targetUnitId,
          jumlah: 1,
          tanggalPinjam: startDate,
          tenggatWaktu: dueDate,
          keperluan: keperluan || null,
          catatan: catatan || null,
          status: statusTransaksi,
        },
        include: {
          pengguna: {
            select: { id: true, nama: true, email: true },
          },
          unit: true,
          barang: true,
        },
      });

      return transaksi;
    });

    return NextResponse.json(
      {
        message:
          statusTransaksi === "MENUNGGU"
            ? "Permohonan peminjaman berhasil diajukan, menunggu persetujuan Admin atau Petugas"
            : "Peminjaman berhasil dicatat",
        data: result,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating transaksi:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}
