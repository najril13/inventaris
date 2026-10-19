import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/auth";

// GET /api/jenis-barang - Ambil semua jenis barang
export async function GET() {
  try {
    const jenisBarangList = await prisma.jenisBarang.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { barang: true },
        },
      },
    });

    return NextResponse.json({ data: jenisBarangList }, { status: 200 });
  } catch (error) {
    console.error("Error fetching jenis barang:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}

// POST /api/jenis-barang - Tambah jenis barang baru
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "Admin" && session.role !== "Petugas")) {
      return NextResponse.json(
        { error: "Akses ditolak. Wewenang Admin atau Petugas diperlukan." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { nama, deskripsi } = body;

    if (!nama || !nama.trim()) {
      return NextResponse.json(
        { error: "Nama jenis barang wajib diisi" },
        { status: 400 },
      );
    }

    const existing = await prisma.jenisBarang.findUnique({
      where: { nama: nama.trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Jenis barang "${nama}" sudah ada` },
        { status: 409 },
      );
    }

    const terakhir = await prisma.jenisBarang.findFirst({
      orderBy: { id: "desc" },
    });

    const nomorBerikutnya = terakhir ? parseInt(terakhir.id, 10) + 1 : 1;
    const newId = String(nomorBerikutnya).padStart(4, "0");

    const jenisBarang = await prisma.jenisBarang.create({
      data: {
        id: newId,
        nama: nama.trim(),
        deskripsi: deskripsi?.trim() || null,
      },
    });

    return NextResponse.json(
      { message: "Jenis barang berhasil ditambahkan", data: jenisBarang },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating jenis barang:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}
