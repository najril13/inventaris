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
                status: { in: ["DIPINJAM", "TERLAMBAT", "MENUNGGU"] },
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

    const totalUnit = barang.units.length;
    const tersediaCount = barang.units.filter((u) => u.status === "TERSEDIA").length;
    const dipinjamCount = barang.units.filter((u) => u.status === "DIPINJAM").length;
    const rusakCount = barang.units.filter((u) => u.status === "RUSAK").length;

    const computedStok = totalUnit > 0 ? tersediaCount : barang.stok;
    const computedStatus =
      totalUnit > 0
        ? tersediaCount > 0
          ? "TERSEDIA"
          : dipinjamCount > 0
            ? "DIPINJAM"
            : "HABIS"
        : barang.status;

    return NextResponse.json(
      {
        data: {
          ...barang,
          stok: computedStok,
          status: computedStatus,
          totalUnit,
          tersediaCount,
          dipinjamCount,
          rusakCount,
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
    if (!session || (session.role !== "Admin" && session.role !== "Petugas")) {
      return NextResponse.json(
        { error: "Akses ditolak. Wewenang Admin atau Petugas diperlukan." },
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

    // Hindari menimpa stok dan status secara manual jika ada units
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
    if (!session || (session.role !== "Admin" && session.role !== "Petugas")) {
      return NextResponse.json(
        { error: "Akses ditolak. Wewenang Admin atau Petugas diperlukan." },
        { status: 403 },
      );
    }

    const { id } = await params;

    // Periksa apakah ada unit yang sedang dipinjam
    const unitDipinjam = await prisma.unitBarang.findFirst({
      where: {
        barangId: id,
        status: { in: ["DIPINJAM", "TERLAMBAT"] },
      },
    });

    if (unitDipinjam) {
      return NextResponse.json(
        {
          error: `Barang tidak dapat dihapus karena unit (${unitDipinjam.serialNumber}) masih dalam status dipinjam`,
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
