import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/auth";

// GET /api/barang - Ambil semua barang beserta unit fisiknya
export async function GET() {
  try {
    const rawList = await prisma.barang.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        kategori: true,
        units: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    const barangList = rawList.map((item) => {
      const totalUnit = item.units.length;
      const tersediaCount = item.units.filter((u) => u.status === "TERSEDIA").length;
      const dipinjamCount = item.units.filter((u) => u.status === "DIPINJAM").length;
      const rusakCount = item.units.filter((u) => u.status === "RUSAK").length;

      const computedStok = totalUnit > 0 ? tersediaCount : item.stok;
      const computedStatus =
        totalUnit > 0
          ? tersediaCount > 0
            ? "TERSEDIA"
            : dipinjamCount > 0
              ? "DIPINJAM"
              : "HABIS"
          : item.status;

      return {
        ...item,
        stok: computedStok,
        status: computedStatus,
        totalUnit,
        tersediaCount,
        dipinjamCount,
        rusakCount,
      };
    });

    return NextResponse.json({ data: barangList }, { status: 200 });
  } catch (error) {
    console.error("Error fetching barang:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}

// POST /api/barang - Tambah barang baru beserta unit-unit fisiknya
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
    const {
      nama,
      kategoriId,
      merek,
      sku,
      kondisi,
      lokasiRak,
      deskripsi,
      serialNumbers,
      serialNumber,
    } = body;

    if (!nama || !sku) {
      return NextResponse.json(
        { error: "Field nama dan SKU wajib diisi" },
        { status: 400 },
      );
    }

    if (!kategoriId) {
      return NextResponse.json(
        { error: "Kategori wajib dipilih" },
        { status: 400 },
      );
    }

    const kategoriValid = await prisma.jenisBarang.findUnique({
      where: { id: kategoriId },
    });

    if (!kategoriValid) {
      return NextResponse.json(
        { error: "Kategori yang dipilih tidak ditemukan" },
        { status: 400 },
      );
    }

    const existing = await prisma.barang.findUnique({ where: { sku } });
    if (existing) {
      return NextResponse.json(
        { error: `SKU "${sku}" sudah digunakan` },
        { status: 409 },
      );
    }

    // Kumpulkan daftar Serial Number yang akan didaftarkan
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

    // Periksa duplikasi nomor seri
    if (listSN.length > 0) {
      const uniqueSN = new Set(listSN);
      if (uniqueSN.size !== listSN.length) {
        return NextResponse.json(
          { error: "Terdapat duplikasi nomor seri dalam daftar input Anda" },
          { status: 400 },
        );
      }

      const duplicateSN = await prisma.unitBarang.findMany({
        where: { serialNumber: { in: listSN } },
        select: { serialNumber: true },
      });

      if (duplicateSN.length > 0) {
        const used = duplicateSN.map((d) => d.serialNumber).join(", ");
        return NextResponse.json(
          { error: `Nomor seri berikut sudah digunakan: ${used}` },
          { status: 409 },
        );
      }
    }

    const barangTerakhir = await prisma.barang.findFirst({
      orderBy: { id: "desc" },
    });

    const nomorBerikutnya = barangTerakhir
      ? parseInt(barangTerakhir.id, 10) + 1
      : 1;

    const newId = String(nomorBerikutnya).padStart(4, "0");

    const totalUnitStart = await prisma.unitBarang.count();

    const created = await prisma.$transaction(async (tx) => {
      const initialStok = listSN.length;
      const initialStatus = initialStok > 0 ? "TERSEDIA" : "HABIS";

      const barang = await tx.barang.create({
        data: {
          id: newId,
          nama,
          kategoriId,
          merek: merek || null,
          sku,
          kondisi: kondisi || "BARU",
          stok: initialStok,
          lokasiRak: lokasiRak || null,
          status: initialStatus,
          deskripsi: deskripsi || null,
        },
        include: { kategori: true },
      });

      let unitCounter = totalUnitStart + 1;
      const createdUnits = [];

      for (const sn of listSN) {
        const kodeUnit = `UNT-${String(unitCounter).padStart(4, "0")}`;
        const u = await tx.unitBarang.create({
          data: {
            kodeUnit,
            serialNumber: sn,
            barangId: newId,
            kondisi: kondisi || "BAIK",
            status: "TERSEDIA",
            lokasiRak: lokasiRak || null,
          },
        });
        createdUnits.push(u);
        unitCounter++;
      }

      return {
        ...barang,
        units: createdUnits,
        totalUnit: createdUnits.length,
        tersediaCount: createdUnits.length,
        dipinjamCount: 0,
        rusakCount: 0,
      };
    });

    return NextResponse.json(
      {
        message: `Barang berhasil ditambahkan dengan ${created.units.length} unit`,
        data: created,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating barang:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}
