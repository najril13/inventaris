import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { prisma } from "@/src/lib/prisma";

const COOKIE_NAME = "session_token";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 hari

export async function createSession(penggunaId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.sesi.create({
    data: {
      token,
      penggunaId,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const sesi = await prisma.sesi.findUnique({
    where: { token },
    include: { pengguna: true },
  });

  if (!sesi) {
    return null;
  }

  if (sesi.expiresAt < new Date()) {
    await prisma.sesi.delete({ where: { id: sesi.id } });
    return null;
  }

  return sesi.pengguna;
}

export async function deleteSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (token) {
    await prisma.sesi.deleteMany({ where: { token } });
    cookieStore.delete(COOKIE_NAME);
  }
}
