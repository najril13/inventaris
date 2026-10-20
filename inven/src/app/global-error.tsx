"use client";

import React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body className="flex min-h-screen items-center justify-center bg-[#101111] px-4 text-zinc-100">
        <div className="max-w-md rounded-2xl border border-zinc-800 bg-[#181919] p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
            ⚠️
          </div>
          <h2 className="text-xl font-bold text-white">Terjadi Kendala Sistem</h2>
          <p className="mt-2 text-sm text-zinc-400">
            {error?.message || "Halaman tidak dapat dimuat saat ini."}
          </p>
          <button
            onClick={() => reset()}
            className="mt-6 rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-bold text-[#08181a] transition hover:bg-cyan-300 cursor-pointer"
          >
            Coba Muat Ulang
          </button>
        </div>
      </body>
    </html>
  );
}
