import { NextResponse } from "next/server";
import { deleteSession } from "@/src/lib/auth";

export async function POST() {
  try {
    await deleteSession();
    return NextResponse.json({ message: "Logout berhasil" }, { status: 200 });
  } catch (error) {
    console.error("Error logout:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}
