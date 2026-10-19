"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Label } from "@heroui/react";
import { Eye, EyeOff, LogIn, Lock, Mail, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Email atau password salah");
        setLoading(false);
        return;
      }

      const tujuan = result.data.role === "Admin" ? "/admin" : "/user";
      router.push(tujuan);
      router.refresh();
    } catch {
      setError("Tidak dapat terhubung ke server");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#101111] px-4 text-zinc-100">
      <Card className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#181919] p-8 shadow-none">
        {/* HEADER */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400">
            <LogIn size={26} strokeWidth={1.8} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Inven Sekolah
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Masuk untuk mengakses sistem inventaris
          </p>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* EMAIL */}
          <div>
            <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Email
            </Label>
            <div className="flex h-11 items-center gap-3 rounded-xl border border-zinc-700 bg-[#101111] px-4 transition-colors focus-within:border-cyan-500">
              <Mail size={16} className="shrink-0 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@sekolah.com"
                className="h-full w-full bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div>
            <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Password
            </Label>
            <div className="flex h-11 items-center gap-3 rounded-xl border border-zinc-700 bg-[#101111] px-4 transition-colors focus-within:border-cyan-500">
              <Lock size={16} className="shrink-0 text-zinc-500" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-full w-full bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="shrink-0 text-zinc-500 hover:text-zinc-300"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* SUBMIT */}
          <Button
            type="submit"
            isDisabled={loading}
            className="mt-2 flex h-11 w-full items-center justify-center rounded-xl bg-cyan-500 text-sm font-semibold text-[#101111] transition hover:bg-cyan-400 disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Masuk"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-500">
          Belum punya akun?{" "}
          <a
            href="/register"
            className="font-semibold text-cyan-400 hover:underline"
          >
            Daftar di sini
          </a>
        </p>

        <p className="mt-2 text-center text-xs text-zinc-600">
          Hubungi administrator jika lupa password
        </p>
      </Card>
    </div>
  );
}
