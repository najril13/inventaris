import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/auth";

type Params = { params: Promise<{ unitId: string }> };

// PATCH /api/barang/units/[unitId] - Edit unit fisik (SN, kondisi, status, lokasi, catatan)
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "Admin" && session.role !== "Petugas")) {
      return NextResponse.json(
        { error: "Akses ditolak. Wewenang Admin atau Petugas diperlukan." },
        { status: 403 },
      );
    }

    const { unitId } = await params;
    const body = await request.json();
    const { serialNumber, kondisi, status, lokasiRak, catatan } = body;

    const existing = await prisma.unitBarang.findUnique({
      where: { id: unitId },
      include: { barang: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Unit barang tidak ditemukan" },
        { status: 404 },
      );
    }

    // Jika ganti SN, pastikan tidak bentrok
    if (serialNumber && serialNumber !== existing.serialNumber) {
      const conflict = await prisma.unitBarang.findUnique({
        where: { serialNumber },
      });
      if (conflict) {
        return NextResponse.json(
          { error: `Nomor seri "${serialNumber}" sudah digunakan` },
          { status: 409 },
        );
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const unit = await tx.unitBarang.update({
        where: { id: unitId },
        data: {
          serialNumber: serialNumber ?? existing.serialNumber,
          kondisi: kondisi ?? existing.kondisi,
          status: status ?? existing.status,
          lokasiRak: lokasiRak !== undefined ? lokasiRak : existing.lokasiRak,
          catatan: catatan !== undefined ? catatan : existing.catatan,
        },
      });

      // Hitung ulang ketersediaan stok pada barang induk
      const availableCount = await tx.unitBarang.count({
        where: { barangId: existing.barangId, status: "TERSEDIA" },
      });

      await tx.barang.update({
        where: { id: existing.barangId },
        data: {
          stok: availableCount,
          status: availableCount > 0 ? "TERSEDIA" : "HABIS",
        },
      });

      return unit;
    });

    return NextResponse.json(
      { message: "Unit barang berhasil diperbarui", data: updated },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating unit:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}

// DELETE /api/barang/units/[unitId] - Hapus unit fisik
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "Admin" && session.role !== "Petugas")) {
      return NextResponse.json(
        { error: "Akses ditolak. Wewenang Admin atau Petugas diperlukan." },
        { status: 403 },
      );
    }

    const { unitId } = await params;
    const existing = await prisma.unitBarang.findUnique({
      where: { id: unitId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Unit barang tidak ditemukan" },
        { status: 404 },
      );
    }

    if (existing.status === "DIPINJAM") {
      return NextResponse.json(
        { error: "Unit sedang dipinjam dan tidak dapat dihapus sebelum dikembalikan" },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.unitBarang.delete({ where: { id: unitId } });

      const availableCount = await tx.unitBarang.count({
        where: { barangId: existing.barangId, status: "TERSEDIA" },
      });

      await tx.barang.update({
        where: { id: existing.barangId },
        data: {
          stok: availableCount,
          status: availableCount > 0 ? "TERSEDIA" : "HABIS",
        },
      });
    });

    return NextResponse.json(
      { message: "Unit barang berhasil dihapus" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting unit:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}
