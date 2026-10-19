import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/auth";

// GET /api/auth/profile - Ambil profil pengguna yang sedang login
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Sesi tidak valid atau telah berakhir" },
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        data: {
          id: session.id,
          nama: session.nama,
          email: session.email,
          role: session.role,
          status: session.status,
          tanggalBergabung: session.tanggalBergabung,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}

// PATCH /api/auth/profile - Update profil (ganti nama, email, atau ganti password)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Silakan login terlebih dahulu" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { nama, email, currentPassword, newPassword } = body;

    const updateData: {
      nama?: string;
      email?: string;
      password?: string;
    } = {};

    // 1. Ganti Nama
    if (nama !== undefined) {
      const trimmedNama = nama.trim();
      if (!trimmedNama) {
        return NextResponse.json(
          { error: "Nama lengkap tidak boleh kosong" },
          { status: 400 },
        );
      }
      updateData.nama = trimmedNama;
    }

    // 2. Ganti Email
    if (email !== undefined) {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail) {
        return NextResponse.json(
          { error: "Alamat email tidak boleh kosong" },
          { status: 400 },
        );
      }

      if (normalizedEmail !== session.email.toLowerCase()) {
        const emailInUse = await prisma.pengguna.findUnique({
          where: { email: normalizedEmail },
        });

        if (emailInUse) {
          return NextResponse.json(
            { error: `Email "${normalizedEmail}" sudah digunakan akun lain` },
            { status: 409 },
          );
        }
        updateData.email = normalizedEmail;
      }
    }

    // 3. Ganti Password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Masukkan password saat ini untuk verifikasi keamanan" },
          { status: 400 },
        );
      }

      // Verifikasi password saat ini
      const isMatch = await bcrypt.compare(currentPassword, session.password);
      if (!isMatch) {
        return NextResponse.json(
          { error: "Password saat ini salah" },
          { status: 400 },
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "Password baru minimal 6 karakter" },
          { status: 400 },
        );
      }

      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "Tidak ada data perubahan yang dikirimkan" },
        { status: 400 },
      );
    }

    const updatedUser = await prisma.pengguna.update({
      where: { id: session.id },
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
      {
        message: newPassword
          ? "Password berhasil diperbarui"
          : "Profil berhasil diperbarui",
        data: updatedUser,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}
