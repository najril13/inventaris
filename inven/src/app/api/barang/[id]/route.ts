import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const barang = await prisma.barang.findUnique({
      where: { id },
      include: {
        kategori: true,
        units: {
          orderBy: { createdAt: "asc" },
          include: {
            transaksi: {
              where: {
                status: { in: ["DIPINJAM", "TERLAMBAT", "MENUNGGU", "MENUNGGU_PENGEMBALIAN"] },
              },
              include: {
                pengguna: {
                  select: { id: true, nama: true, email: true },
                },
              },
              take: 1,
            },
          },
        },
      },
    });

    if (!barang) {
      return NextResponse.json(
        { error: "Barang tidak ditemukan" },
        { status: 404 },
      );
    }

    const isDipinjam = barang.status === "DIPINJAM";
    const computedStok = isDipinjam ? 0 : 1;
    const computedStatus = isDipinjam
      ? "DIPINJAM"
      : barang.status === "RUSAK"
        ? "RUSAK"
        : "TERSEDIA";

    return NextResponse.json(
      {
        data: {
          ...barang,
          stok: computedStok,
          status: computedStatus,
          totalUnit: 1,
          tersediaCount: computedStok,
          dipinjamCount: isDipinjam ? 1 : 0,
          rusakCount: barang.status === "RUSAK" ? 1 : 0,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching barang:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    if (!session || session.role !== "Admin") {
      return NextResponse.json(
        { error: "Hanya Admin yang berwenang mengubah barang" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await request.json();

    if (body.kategoriId) {
      const kategoriValid = await prisma.jenisBarang.findUnique({
        where: { id: body.kategoriId },
      });

      if (!kategoriValid) {
        return NextResponse.json(
          { error: "Kategori yang dipilih tidak ditemukan" },
          { status: 400 },
        );
      }
    }

    const { ...safeBody } = body;

    const barang = await prisma.barang.update({
      where: { id },
      data: safeBody,
      include: {
        kategori: true,
        units: true,
      },
    });

    return NextResponse.json(
      { message: "Barang berhasil diperbarui", data: barang },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating barang:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    if (!session || session.role !== "Admin") {
      return NextResponse.json(
        { error: "Hanya Admin yang berwenang menghapus barang" },
        { status: 403 },
      );
    }

    const { id } = await params;

    // Periksa apakah ada transaksi aktif untuk barang ini
    const activeTx = await prisma.transaksi.findFirst({
      where: {
        barangId: id,
        status: { in: ["DIPINJAM", "TERLAMBAT", "MENUNGGU", "MENUNGGU_PENGEMBALIAN"] },
      },
    });

    if (activeTx) {
      return NextResponse.json(
        {
          error:
            "Barang tidak dapat dihapus karena masih ada transaksi aktif atau permohonan peminjaman",
        },
        { status: 400 },
      );
    }

    await prisma.barang.delete({ where: { id } });

    return NextResponse.json(
      { message: "Barang berhasil dihapus" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting barang:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}
