import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/auth";

type Params = { params: Promise<{ id: string }> };

// GET /api/barang/[id]/units - Ambil semua unit fisik ber-SN untuk barang ini
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const barang = await prisma.barang.findUnique({
      where: { id },
      include: {
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

    return NextResponse.json(
      {
        data: {
          barang: {
            id: barang.id,
            nama: barang.nama,
            sku: barang.sku,
            merek: barang.merek,
          },
          units: barang.units,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching units:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}

// POST /api/barang/[id]/units - Tambah unit ber-SN baru ke barang ini
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "Admin" && session.role !== "Petugas")) {
      return NextResponse.json(
        { error: "Akses ditolak. Wewenang Admin atau Petugas diperlukan." },
        { status: 403 },
      );
    }

    const { id: barangId } = await params;
    const body = await request.json();

    const barang = await prisma.barang.findUnique({
      where: { id: barangId },
    });

    if (!barang) {
      return NextResponse.json(
        { error: "Barang tidak ditemukan" },
        { status: 404 },
      );
    }

    // Mendukung penambahan unit tunggal atau massal (array of serialNumbers)
    const { serialNumber, serialNumbers, kondisi = "BAIK", lokasiRak, catatan } = body;

    const listSN: string[] = [];
    if (Array.isArray(serialNumbers)) {
      listSN.push(
        ...serialNumbers
          .map((s: string) => String(s).trim())
          .filter((s: string) => s.length > 0),
      );
    } else if (serialNumber && typeof serialNumber === "string" && serialNumber.trim().length > 0) {
      listSN.push(serialNumber.trim());
    }

    if (listSN.length === 0) {
      return NextResponse.json(
        { error: "Nomor Seri (Serial Number) wajib diisi" },
        { status: 400 },
      );
    }

    // Validasi apakah ada SN yang duplikat dalam request
    const uniqueInRequest = new Set(listSN);
    if (uniqueInRequest.size !== listSN.length) {
      return NextResponse.json(
        { error: "Terdapat duplikasi nomor seri dalam input Anda" },
        { status: 400 },
      );
    }

    // Cek apakah ada SN yang sudah terdaftar di database
    const existing = await prisma.unitBarang.findMany({
      where: { serialNumber: { in: listSN } },
      select: { serialNumber: true },
    });

    if (existing.length > 0) {
      const usedSN = existing.map((e) => e.serialNumber).join(", ");
      return NextResponse.json(
        { error: `Nomor seri berikut sudah digunakan: ${usedSN}` },
        { status: 409 },
      );
    }

    // Hitung total unit yang ada untuk membuat kode unit otomatis
    const totalUnitAll = await prisma.unitBarang.count();

    const createdUnits = await prisma.$transaction(async (tx) => {
      const units = [];
      let counter = totalUnitAll + 1;

      for (const sn of listSN) {
        const kodeUnit = `UNT-${String(counter).padStart(4, "0")}`;
        const u = await tx.unitBarang.create({
          data: {
            kodeUnit,
            serialNumber: sn,
            barangId,
            kondisi,
            status: "TERSEDIA",
            lokasiRak: lokasiRak || barang.lokasiRak || null,
            catatan: catatan || null,
          },
        });
        units.push(u);
        counter++;
      }

      // Hitung ulang stok barang berdasarkan unit yang berstatus TERSEDIA
      const availableCount = await tx.unitBarang.count({
        where: { barangId, status: "TERSEDIA" },
      });

      await tx.barang.update({
        where: { id: barangId },
        data: {
          stok: availableCount,
          status: availableCount > 0 ? "TERSEDIA" : "HABIS",
        },
      });

      return units;
    });

    return NextResponse.json(
      {
        message: `${createdUnits.length} unit berhasil ditambahkan`,
        data: createdUnits,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating units:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}
