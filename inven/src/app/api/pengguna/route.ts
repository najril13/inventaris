import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/src/lib/prisma";
import { getSession } from "@/src/lib/auth";

// GET /api/pengguna - Ambil semua pengguna (tanpa password)
export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== "Admin" && session.role !== "Petugas")) {
      return NextResponse.json(
        { error: "Akses ditolak" },
        { status: 403 },
      );
    }

    const penggunaList = await prisma.pengguna.findMany({
      orderBy: { tanggalBergabung: "desc" },
      select: {
        id: true,
        nama: true,
        username: true,
        email: true,
        role: true,
        status: true,
        tanggalBergabung: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ data: penggunaList }, { status: 200 });
  } catch (error) {
    console.error("Error fetching pengguna:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}

// POST /api/pengguna - Tambah pengguna baru oleh Admin
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "Admin") {
      return NextResponse.json(
        { error: "Hanya Admin yang berwenang menambahkan pengguna" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      nama,
      username,
      email,
      password,
      role = "User",
      status = "Active",
    } = body;

    if (!nama || !nama.trim()) {
      return NextResponse.json(
        { error: "Nama lengkap wajib diisi" },
        { status: 400 },
      );
    }

    if (!username || !username.trim()) {
      return NextResponse.json(
        { error: "Username wajib diisi" },
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

    const existingUsername = await prisma.pengguna.findUnique({
      where: { username: cleanUsername },
    });

    if (existingUsername) {
      return NextResponse.json(
        { error: `Username "${cleanUsername}" sudah digunakan akun lain` },
        { status: 409 },
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password wajib diisi minimal 6 karakter" },
        { status: 400 },
      );
    }

    const validRoles = ["Admin", "Petugas", "User"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Role tidak valid" },
        { status: 400 },
      );
    }

    const validStatuses = ["Active", "Inactive"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Status tidak valid" },
        { status: 400 },
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

    const pengguna = await prisma.pengguna.create({
      data: {
        nama: nama.trim(),
        username: cleanUsername,
        email: normalizedEmail,
        password: hashedPassword,
        role,
        status,
      },
      select: {
        id: true,
        nama: true,
        username: true,
        email: true,
        role: true,
        status: true,
        tanggalBergabung: true,
      },
    });

    return NextResponse.json(
      { message: "Pengguna berhasil ditambahkan", data: pengguna },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating pengguna:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}
