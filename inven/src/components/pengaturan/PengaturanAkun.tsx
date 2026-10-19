"use client";

import React, { useState, useEffect, type FormEvent } from "react";
import { Button, Card } from "@heroui/react";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Save,
  KeyRound,
  ShieldCheck,
  Calendar,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "@/src/lib/toast";
import {
  INPUT_CLASS,
  LABEL_CLASS,
  SECTION_TITLE_CLASS,
  SECTION_SUBTITLE_CLASS,
} from "@/src/lib/form_style";

type ProfileData = {
  id: string;
  nama: string;
  email: string;
  role: string;
  status: string;
  tanggalBergabung: string;
};

function getInitials(name: string): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function PengaturanAkun({ roleTitle }: { roleTitle: string }) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // State Form Profil
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // State Form Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/auth/profile");
        const result = await res.json();
        if (res.ok && result.data) {
          setProfile(result.data);
          setNama(result.data.nama);
          setEmail(result.data.email);
        }
      } catch (err) {
        console.error("Error loading profile:", err);
        toast.error("Gagal memuat profil pengguna");
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, []);

  // Handler Simpan Nama & Email
  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || !email.trim()) {
      toast.error("Nama lengkap dan email tidak boleh kosong");
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: nama.trim(), email: email.trim() }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error("Gagal menyimpan profil", result.error || "Terjadi kesalahan");
        return;
      }

      toast.success("Profil Diperbarui", "Nama dan email berhasil diperbarui");
      setProfile((prev) => (prev ? { ...prev, nama, email } : null));
    } catch {
      toast.error("Terjadi kesalahan", "Tidak dapat terhubung ke server");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Handler Ganti Password
  const handleUpdatePassword = async (e: FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error("Masukkan password saat ini");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password baru minimal 6 karakter");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi password baru tidak cocok");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error("Gagal mengganti password", result.error || "Password lama salah");
        return;
      }

      toast.success("Password Berhasil Diganti", "Gunakan password baru saat login berikutnya");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Terjadi kesalahan", "Tidak dapat terhubung ke server");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-cyan-400" size={32} />
        <p className="text-sm text-zinc-400">Memuat pengaturan akun...</p>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-5 py-7 lg:px-8">
      {/* HEADER */}
      <section>
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Pengaturan Akun
          </h2>
          <span className="flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400">
            <ShieldCheck size={14} />
            {roleTitle}
          </span>
        </div>
        <p className="mt-1.5 text-sm text-zinc-400">
          Kelola informasi identitas profil dan keamanan kata sandi akun Anda.
        </p>
      </section>

      {/* USER CARD INFO RINGKAS */}
      <Card className="rounded-2xl border border-zinc-800 bg-[#181919] p-6 shadow-none">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-xl font-bold text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.15)]">
              {getInitials(profile?.nama || "")}
            </div>
            <div>
              <h3 className="text-xl font-bold text-zinc-100">
                {profile?.nama}
              </h3>
              <p className="text-sm text-zinc-400">{profile?.email}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-cyan-400 border border-zinc-700">
                  Role: {profile?.role}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 size={12} />
                  Status: {profile?.status}
                </span>
              </div>
            </div>
          </div>

          {profile?.tanggalBergabung && (
            <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-[#101111] px-4 py-3 text-xs text-zinc-400 sm:self-center">
              <Calendar size={16} className="text-zinc-500" />
              <span>Bergabung sejak {formatDate(profile.tanggalBergabung)}</span>
            </div>
          )}
        </div>
      </Card>

      {/* DUA KOLOM PENGATURAN */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* 1. UBAH PROFIL (NAMA & EMAIL) */}
        <Card className="rounded-2xl border border-zinc-800 bg-[#181919] p-6 lg:p-7 shadow-none">
          <div className="mb-6">
            <h3 className={SECTION_TITLE_CLASS}>
              <User size={20} className="text-cyan-400" />
              Informasi Profil
            </h3>
            <p className={SECTION_SUBTITLE_CLASS}>
              Perbarui nama tampilan dan alamat email login Anda.
            </p>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-5">
            <div>
              <label htmlFor="input-nama" className={LABEL_CLASS}>
                Nama Lengkap *
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-zinc-500">
                  <User size={16} />
                </span>
                <input
                  id="input-nama"
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Nama Lengkap Anda"
                  className={`${INPUT_CLASS} pl-11`}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="input-email" className={LABEL_CLASS}>
                Alamat Email *
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-zinc-500">
                  <Mail size={16} />
                </span>
                <input
                  id="input-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@sekolah.sch.id"
                  className={`${INPUT_CLASS} pl-11`}
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                isDisabled={isUpdatingProfile}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 text-sm font-semibold text-[#08181a] transition hover:bg-cyan-400 disabled:opacity-50"
              >
                {isUpdatingProfile ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Save size={18} strokeWidth={2.2} />
                )}
                {isUpdatingProfile ? "Menyimpan..." : "Simpan Perubahan Profil"}
              </Button>
            </div>
          </form>
        </Card>

        {/* 2. GANTI PASSWORD */}
        <Card className="rounded-2xl border border-zinc-800 bg-[#181919] p-6 lg:p-7 shadow-none">
          <div className="mb-6">
            <h3 className={SECTION_TITLE_CLASS}>
              <KeyRound size={20} className="text-emerald-400" />
              Keamanan Kata Sandi
            </h3>
            <p className={SECTION_SUBTITLE_CLASS}>
              Ubah password secara berkala untuk menjaga keamanan akun.
            </p>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label htmlFor="input-old-pw" className={LABEL_CLASS}>
                Password Saat Ini *
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-zinc-500">
                  <Lock size={16} />
                </span>
                <input
                  id="input-old-pw"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Ketik password lama Anda"
                  className={`${INPUT_CLASS} pl-11 pr-11`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-4 text-zinc-500 transition hover:text-zinc-300"
                >
                  {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="input-new-pw" className={LABEL_CLASS}>
                Password Baru *
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-zinc-500">
                  <Lock size={16} />
                </span>
                <input
                  id="input-new-pw"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className={`${INPUT_CLASS} pl-11 pr-11`}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 text-zinc-500 transition hover:text-zinc-300"
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="input-confirm-pw" className={LABEL_CLASS}>
                Konfirmasi Password Baru *
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-zinc-500">
                  <Lock size={16} />
                </span>
                <input
                  id="input-confirm-pw"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang password baru"
                  className={`${INPUT_CLASS} pl-11 pr-11`}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 text-zinc-500 transition hover:text-zinc-300"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="mt-1 text-xs text-red-400">
                  Konfirmasi password tidak cocok dengan password baru
                </p>
              )}
            </div>

            <div className="pt-3">
              <Button
                type="submit"
                isDisabled={
                  isUpdatingPassword ||
                  !currentPassword ||
                  newPassword.length < 6 ||
                  newPassword !== confirmPassword
                }
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 text-sm font-semibold text-[#08181a] transition hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isUpdatingPassword ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <KeyRound size={18} strokeWidth={2.2} />
                )}
                {isUpdatingPassword ? "Menyimpan..." : "Perbarui Password"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </main>
  );
}
