import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/src/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { nama, username, email, password } = await request.json();

    if (!nama || !username || !password) {
      return NextResponse.json(
        { error: "Nama, username, dan password wajib diisi" },
        { status: 400 },
      );
    }

    const cleanUsername = String(username).trim().toLowerCase();
    if (cleanUsername.length < 3) {
      return NextResponse.json(
        { error: "Username minimal 3 karakter" },
        { status: 400 },
      );
    }

    if (!/^[a-zA-Z0-9_.-]+$/.test(cleanUsername)) {
      return NextResponse.json(
        {
          error:
            "Username hanya boleh berisi huruf, angka, titik, strip (-), dan underscore (_)",
        },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter" },
        { status: 400 },
      );
    }

    const existingUsername = await prisma.pengguna.findUnique({
      where: { username: cleanUsername },
    });
    if (existingUsername) {
      return NextResponse.json(
        {
          error: `Username "${cleanUsername}" sudah digunakan, silakan pilih username lain`,
        },
        { status: 409 },
      );
    }

    let normalizedEmail: string | null = null;
    if (email && String(email).trim()) {
      normalizedEmail = String(email).trim().toLowerCase();
      const existingEmail = await prisma.pengguna.findUnique({
        where: { email: normalizedEmail },
      });
      if (existingEmail) {
        return NextResponse.json(
          { error: `Email "${normalizedEmail}" sudah terdaftar` },
          { status: 409 },
        );
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Jika belum ada user sama sekali di database, akun pertama dijadikan Admin
    const totalPengguna = await prisma.pengguna.count();
    const assignedRole = totalPengguna === 0 ? "Admin" : "User";

    const pengguna = await prisma.pengguna.create({
      data: {
        nama: nama.trim(),
        username: cleanUsername,
        email: normalizedEmail,
        password: hashedPassword,
        role: assignedRole,
      },
    });

    return NextResponse.json(
      {
        message: "Akun berhasil dibuat",
        data: {
          id: pengguna.id,
          nama: pengguna.nama,
          username: pengguna.username,
          email: pengguna.email,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error register:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}
