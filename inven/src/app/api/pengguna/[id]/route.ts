import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/auth";

type Params = { params: Promise<{ id: string }> };

// GET /api/pengguna/[id] - Ambil detail satu pengguna
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

    // Pengguna biasa hanya boleh melihat data profilnya sendiri
    if (session.role === "User" && session.id !== id) {
      return NextResponse.json(
        { error: "Akses ditolak" },
        { status: 403 },
      );
    }

    const pengguna = await prisma.pengguna.findUnique({
      where: { id },
      select: {
        id: true,
        nama: true,
        email: true,
        role: true,
        status: true,
        tanggalBergabung: true,
        updatedAt: true,
      },
    });

    if (!pengguna) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan" },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: pengguna }, { status: 200 });
  } catch (error) {
    console.error("Error fetching detail pengguna:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}

// PATCH /api/pengguna/[id] - Update data pengguna
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
    const { nama, email, role, status, password } = body;

    const existingUser = await prisma.pengguna.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan" },
        { status: 404 },
      );
    }

    const isAdmin = session.role === "Admin";
    const isSelf = session.id === id;

    if (!isAdmin && !isSelf) {
      return NextResponse.json(
        { error: "Akses ditolak" },
        { status: 403 },
      );
    }

    // Pengguna non-admin tidak boleh mengubah role atau status akunnya
    if (!isAdmin && (role !== undefined || status !== undefined)) {
      return NextResponse.json(
        { error: "Anda tidak memiliki wewenang mengubah role atau status" },
        { status: 403 },
      );
    }

    // Validasi pencegahan penghapusan status Admin terakhir
    if (existingUser.role === "Admin") {
      if (role && role !== "Admin") {
        const totalAdmin = await prisma.pengguna.count({
          where: { role: "Admin" },
        });
        if (totalAdmin <= 1) {
          return NextResponse.json(
            { error: "Tidak dapat mengubah role Admin terakhir dalam sistem" },
            { status: 400 },
          );
        }
      }

      if (status && status === "Inactive") {
        const activeAdmin = await prisma.pengguna.count({
          where: { role: "Admin", status: "Active" },
        });
        if (activeAdmin <= 1 && existingUser.status === "Active") {
          return NextResponse.json(
            { error: "Tidak dapat menonaktifkan Admin aktif terakhir" },
            { status: 400 },
          );
        }
      }
    }

    const updateData: {
      nama?: string;
      email?: string;
      role?: string;
      status?: string;
      password?: string;
    } = {};

    if (nama !== undefined) {
      if (!nama.trim()) {
        return NextResponse.json(
          { error: "Nama lengkap tidak boleh kosong" },
          { status: 400 },
        );
      }
      updateData.nama = nama.trim();
    }

    if (email !== undefined) {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail) {
        return NextResponse.json(
          { error: "Email tidak boleh kosong" },
          { status: 400 },
        );
      }
      if (normalizedEmail !== existingUser.email) {
        const emailExists = await prisma.pengguna.findUnique({
          where: { email: normalizedEmail },
        });
        if (emailExists) {
          return NextResponse.json(
            { error: `Email "${normalizedEmail}" sudah digunakan pengguna lain` },
            { status: 409 },
          );
        }
        updateData.email = normalizedEmail;
      }
    }

    if (isAdmin && role !== undefined) {
      const validRoles = ["Admin", "Petugas", "User"];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: "Role tidak valid" },
          { status: 400 },
        );
      }
      updateData.role = role;
    }

    if (isAdmin && status !== undefined) {
      const validStatuses = ["Active", "Inactive"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: "Status tidak valid" },
          { status: 400 },
        );
      }
      updateData.status = status;
    }

    if (password !== undefined && password !== "") {
      if (password.length < 6) {
        return NextResponse.json(
          { error: "Password baru minimal 6 karakter" },
          { status: 400 },
        );
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.pengguna.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        nama: true,
        email: true,
        role: true,
        status: true,
        tanggalBergabung: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      { message: "Data pengguna berhasil diperbarui", data: updated },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating pengguna:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}

// DELETE /api/pengguna/[id] - Hapus pengguna (Admin only)
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    if (!session || session.role !== "Admin") {
      return NextResponse.json(
        { error: "Hanya Admin yang berwenang menghapus pengguna" },
        { status: 403 },
      );
    }

    const { id } = await params;

    const existingUser = await prisma.pengguna.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan" },
        { status: 404 },
      );
    }

    if (existingUser.role === "Admin") {
      const totalAdmin = await prisma.pengguna.count({
        where: { role: "Admin" },
      });
      if (totalAdmin <= 1) {
        return NextResponse.json(
          { error: "Tidak dapat menghapus akun Admin terakhir dalam sistem" },
          { status: 400 },
        );
      }
    }

    await prisma.pengguna.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Pengguna berhasil dihapus" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting pengguna:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}
