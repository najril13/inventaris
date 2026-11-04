import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/auth";

// GET /api/barang - Ambil semua barang
export async function GET() {
  try {
    const rawList = await prisma.barang.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        kategori: true,
        units: {
          orderBy: { createdAt: "asc" },
        },
        transaksi: {
          where: {
            status: { in: ["DIPINJAM", "TERLAMBAT", "MENUNGGU", "MENUNGGU_PENGEMBALIAN"] },
          },
          include: {
            pengguna: {
              select: { id: true, nama: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    const barangList = rawList.map((item) => {
      const activeTx = item.transaksi[0] || null;
      const isDipinjam =
        activeTx &&
        (activeTx.status === "DIPINJAM" ||
          activeTx.status === "TERLAMBAT" ||
          activeTx.status === "MENUNGGU_PENGEMBALIAN");
      const isMenunggu = activeTx && activeTx.status === "MENUNGGU";

      // Konsep utama: setiap barang adalah 1 unit
      let computedStatus = "TERSEDIA";
      let computedStok = 1;

      if (isDipinjam || item.status === "DIPINJAM") {
        computedStatus = "DIPINJAM";
        computedStok = 0;
      } else if (isMenunggu) {
        computedStatus = "MENUNGGU";
        computedStok = 1;
      } else if (item.status === "RUSAK") {
        computedStatus = "RUSAK";
        computedStok = 0;
      }

      const totalUnit = item.units.length > 0 ? item.units.length : 1;
      const tersediaCount = computedStatus === "TERSEDIA" ? 1 : 0;
      const dipinjamCount = computedStatus === "DIPINJAM" ? 1 : 0;

      return {
        ...item,
        stok: computedStok,
        status: computedStatus,
        totalUnit,
        tersediaCount,
        dipinjamCount,
        rusakCount: item.status === "RUSAK" ? 1 : 0,
        activeTx: activeTx
          ? {
              id: activeTx.id,
              kodeTransaksi: activeTx.kodeTransaksi,
              status: activeTx.status,
              peminjamNama: activeTx.pengguna.nama,
              tenggatWaktu: activeTx.tenggatWaktu,
            }
          : null,
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

// POST /api/barang - Tambah barang baru (1 unit per barang)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "Admin") {
      return NextResponse.json(
        { error: "Hanya Admin yang berwenang menambahkan barang" },
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

    // Tentukan nomor seri untuk 1 unit barang ini
    let snInput = "";
    if (serialNumber && typeof serialNumber === "string" && serialNumber.trim().length > 0) {
      snInput = serialNumber.trim();
    } else if (Array.isArray(serialNumbers) && serialNumbers.length > 0) {
      snInput = String(serialNumbers[0]).trim();
    }

    const finalSN = snInput || `SN-${sku.toUpperCase()}`;

    // Cek apakah nomor seri sudah pernah dipakai unit lain
    const duplicateSN = await prisma.unitBarang.findUnique({
      where: { serialNumber: finalSN },
    });

    if (duplicateSN) {
      return NextResponse.json(
        { error: `Nomor seri "${finalSN}" sudah digunakan pada barang lain` },
        { status: 409 },
      );
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
      // Setiap barang adalah 1 unit fisik:
      const barang = await tx.barang.create({
        data: {
          id: newId,
          nama: nama.trim(),
          kategoriId,
          merek: merek ? merek.trim() : null,
          sku: sku.trim(),
          kondisi: kondisi || "BARU",
          stok: 1,
          lokasiRak: lokasiRak ? lokasiRak.trim() : null,
          status: "TERSEDIA",
          deskripsi: deskripsi ? deskripsi.trim() : null,
        },
        include: { kategori: true },
      });

      const kodeUnit = `UNT-${String(totalUnitStart + 1).padStart(4, "0")}`;
      const unit = await tx.unitBarang.create({
        data: {
          kodeUnit,
          serialNumber: finalSN,
          barangId: newId,
          kondisi: kondisi || "BAIK",
          status: "TERSEDIA",
          lokasiRak: lokasiRak ? lokasiRak.trim() : null,
        },
      });

      return {
        ...barang,
        units: [unit],
        totalUnit: 1,
        tersediaCount: 1,
        dipinjamCount: 0,
        rusakCount: 0,
      };
    });

    return NextResponse.json(
      {
        message: `Barang "${created.nama}" berhasil ditambahkan (1 Unit)`,
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
