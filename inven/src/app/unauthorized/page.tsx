"use client";

import Link from "next/link";
import { Card, Button } from "@heroui/react";
import { ShieldAlert, ArrowLeft, LogIn } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#101111] px-4 text-zinc-100">
      <Card className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#181919] p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
          <ShieldAlert size={36} />
        </div>

        <h1 className="mt-5 text-2xl font-bold tracking-tight text-white">
          Akses Ditolak (403)
        </h1>

        <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
          Anda tidak memiliki izin untuk mengakses halaman ini. Halaman ini
          dibatasi berdasarkan peran akun Anda.
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/login" className="flex-1">
            <Button
              type="button"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-transparent px-4 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-800"
            >
              <LogIn size={16} />
              Ganti Akun
            </Button>
          </Link>

          <button
            type="button"
            onClick={() => window.history.back()}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 text-sm font-semibold text-[#08181a] transition hover:bg-cyan-400"
          >
            <ArrowLeft size={16} />
            Kembali
          </button>
        </div>
      </Card>
    </div>
  );
}
