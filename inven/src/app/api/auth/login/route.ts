import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/src/lib/prisma";
import { createSession } from "@/src/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan password wajib diisi" },
        { status: 400 },
      );
    }

    const pengguna = await prisma.pengguna.findUnique({ where: { email } });

    if (!pengguna) {
      return NextResponse.json(
        { error: "Email atau password salah" },
        { status: 401 },
      );
    }

    if (pengguna.status !== "Active") {
      return NextResponse.json(
        { error: "Akun ini sedang tidak aktif" },
        { status: 403 },
      );
    }

    const isValidPassword = await bcrypt.compare(password, pengguna.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Email atau password salah" },
        { status: 401 },
      );
    }

    await createSession(pengguna.id);

    return NextResponse.json(
      {
        message: "Login berhasil",
        data: { id: pengguna.id, nama: pengguna.nama, role: pengguna.role },
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("Error login:", error);

    const err = error as { code?: string; message?: string };
    const isDbError =
      err?.code === "P2039" ||
      err?.code === "P1001" ||
      err?.message?.includes("pool timeout") ||
      err?.message?.includes("ECONNREFUSED") ||
      err?.message?.includes("connect");

    if (isDbError) {
      return NextResponse.json(
        {
          error:
            "Gagal terhubung ke database. Pastikan MySQL di XAMPP sudah diaktifkan (Start).",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}
