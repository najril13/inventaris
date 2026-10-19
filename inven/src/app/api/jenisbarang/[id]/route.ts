import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/auth";

type Params = { params: Promise<{ id: string }> };

// GET /api/jenis-barang/[id]
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const jenisBarang = await prisma.jenisBarang.findUnique({
      where: { id },
    });

    if (!jenisBarang) {
      return NextResponse.json(
        { error: "Jenis barang tidak ditemukan" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: jenisBarang }, { status: 200 });
  } catch (error) {
    console.error("Error fetching jenis barang:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}

// PATCH /api/jenis-barang/[id]
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
    const { nama, deskripsi } = body;

    if (!nama || !nama.trim()) {
      return NextResponse.json(
        { error: "Nama jenis barang wajib diisi" },
        { status: 400 },
      );
    }

    const jenisBarang = await prisma.jenisBarang.update({
      where: { id },
      data: {
        nama: nama.trim(),
        deskripsi: deskripsi?.trim() || null,
      },
    });

    return NextResponse.json(
      { message: "Jenis barang berhasil diperbarui", data: jenisBarang },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating jenis barang:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}

// DELETE /api/jenis-barang/[id]
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

    const jumlahBarang = await prisma.barang.count({
      where: { kategoriId: id },
    });

    if (jumlahBarang > 0) {
      return NextResponse.json(
        {
          error: `Tidak bisa menghapus, masih ada ${jumlahBarang} barang yang menggunakan jenis ini`,
        },
        { status: 409 },
      );
    }

    await prisma.jenisBarang.delete({ where: { id } });

    return NextResponse.json(
      { message: "Jenis barang berhasil dihapus" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting jenis barang:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}
