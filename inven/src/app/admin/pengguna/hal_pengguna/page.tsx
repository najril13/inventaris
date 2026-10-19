"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Button, Card } from "@heroui/react";
import {
  ChevronLeft,
  Mail,
  Save,
  User,
  Shield,
  Activity,
  Lock,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { useState, useEffect, Suspense, type FormEvent } from "react";
import { toast } from "@/src/lib/toast";
import {
  INPUT_CLASS,
  LABEL_CLASS,
  SECTION_TITLE_CLASS,
  SECTION_SUBTITLE_CLASS,
} from "@/src/lib/form_style";

const SELECT_CLASS =
  "h-11 w-full rounded-xl border border-zinc-700 bg-[#0f1010] px-4 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600 focus:border-cyan-500";

function FormPenggunaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const editId = searchParams.get("id");
  const isEditMode = Boolean(editId);

  // Form states
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"Admin" | "Petugas" | "User">("User");
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditMode);

  // Load detail user jika mode edit
  useEffect(() => {
    if (!editId) return;

    let isMounted = true;
    async function fetchDetail() {
      setIsFetching(true);
      try {
        const res = await fetch(`/api/pengguna/${editId}`);
        const result = await res.json();

        if (!res.ok) {
          toast.error("Gagal memuat pengguna", result.error || "Data tidak ditemukan");
          router.push("/admin/pengguna");
          return;
        }

        if (isMounted) {
          setNama(result.data.nama || "");
          setEmail(result.data.email || "");
          setRole(result.data.role || "User");
          setStatus(result.data.status || "Active");
        }
      } catch {
        toast.error("Terjadi kesalahan", "Tidak dapat terhubung ke server");
        router.push("/admin/pengguna");
      } finally {
        if (isMounted) {
          setIsFetching(false);
        }
      }
    }

    fetchDetail();

    return () => {
      isMounted = false;
    };
  }, [editId, router]);

  // Validasi form
  const isValid =
    nama.trim() !== "" &&
    email.trim() !== "" &&
    (isEditMode ? (password === "" || password.length >= 6) : password.length >= 6);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const url = isEditMode ? `/api/pengguna/${editId}` : "/api/pengguna";
      const method = isEditMode ? "PATCH" : "POST";

      const payload: {
        nama: string;
        email: string;
        role: "Admin" | "Petugas" | "User";
        status: "Active" | "Inactive";
        password?: string;
      } = {
        nama: nama.trim(),
        email: email.trim(),
        role,
        status,
      };

      if (password) {
        payload.password = password;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error("Gagal menyimpan pengguna", result.error || "Terjadi kesalahan");
        setIsSubmitting(false);
        return;
      }

      toast.success(
        isEditMode ? "Pengguna diperbarui" : "Pengguna ditambahkan",
        result.message || "Data pengguna berhasil disimpan",
      );

      router.push("/admin/pengguna");
    } catch {
      toast.error("Terjadi kesalahan", "Tidak dapat terhubung ke server");
      setIsSubmitting(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-cyan-400" size={32} />
        <p className="text-sm text-zinc-400">Memuat data pengguna...</p>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-5 py-7 lg:px-8">
      {/* PAGE HEADER */}
      <section className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => router.push("/admin/pengguna")}
          className="flex w-fit items-center gap-1.5 text-sm font-medium text-zinc-400 transition hover:text-cyan-400"
        >
          <ChevronLeft size={16} />
          Kembali ke Manajemen Pengguna
        </button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-100">
              {isEditMode ? "Edit Data Pengguna" : "Tambah Pengguna Baru"}
            </h2>
            <p className="mt-1.5 text-sm text-zinc-400">
              {isEditMode
                ? "Perbarui informasi akun, peran akses, dan status pengguna."
                : "Masukkan data identitas dan pengaturan akses untuk membuat akun baru."}
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <Button
              type="button"
              onPress={() => router.push("/admin/pengguna")}
              className="h-11 rounded-xl border border-zinc-700 bg-transparent px-5 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-800"
            >
              Batal
            </Button>
            <Button
              type="button"
              onPress={() => {
                const form = document.getElementById(
                  "form-pengguna",
                ) as HTMLFormElement;
                if (form) form.requestSubmit();
              }}
              isDisabled={!isValid || isSubmitting}
              className="flex h-11 items-center gap-2 rounded-xl bg-cyan-500 px-5 text-sm font-semibold text-[#08181a] transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} strokeWidth={2.2} />
              )}
              {isSubmitting ? "Menyimpan..." : "Simpan Pengguna"}
            </Button>
          </div>
        </div>
      </section>

      {/* FORM UTAMA */}
      <form id="form-pengguna" onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* KARTU 1: INFORMASI AKUN */}
          <Card className="rounded-2xl border border-zinc-800 bg-[#181919] p-6 lg:p-7 shadow-none">
            <div className="mb-6">
              <h3 className={SECTION_TITLE_CLASS}>
                <User size={20} className="text-cyan-400" />
                Informasi Akun
              </h3>
              <p className={SECTION_SUBTITLE_CLASS}>
                Data identitas dan email yang digunakan untuk login.
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label htmlFor="nama-pengguna" className={LABEL_CLASS}>
                  Nama Lengkap *
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-zinc-500">
                    <User size={16} />
                  </span>
                  <input
                    id="nama-pengguna"
                    type="text"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Contoh: Ahmad Fadilah"
                    className={`${INPUT_CLASS} pl-11`}
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email-pengguna" className={LABEL_CLASS}>
                  Alamat Email *
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-zinc-500">
                    <Mail size={16} />
                  </span>
                  <input
                    id="email-pengguna"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Contoh: ahmad@sekolah.sch.id"
                    className={`${INPUT_CLASS} pl-11`}
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password-pengguna" className={LABEL_CLASS}>
                  {isEditMode ? "Password Baru (Opsional)" : "Password *"}
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-zinc-500">
                    <Lock size={16} />
                  </span>
                  <input
                    id="password-pengguna"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={
                      isEditMode
                        ? "Kosongkan jika tidak ingin mengubah password"
                        : "Minimal 6 karakter"
                    }
                    className={`${INPUT_CLASS} pl-11 pr-11`}
                    required={!isEditMode}
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 text-zinc-500 transition hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {password !== "" && password.length < 6 && (
                  <p className="mt-1 text-xs text-red-400">
                    Password minimal 6 karakter
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* KARTU 2: HAK AKSES & STATUS */}
          <Card className="rounded-2xl border border-zinc-800 bg-[#181919] p-6 lg:p-7 shadow-none">
            <div className="mb-6">
              <h3 className={SECTION_TITLE_CLASS}>
                <Shield size={20} className="text-emerald-400" />
                Hak Akses & Status
              </h3>
              <p className={SECTION_SUBTITLE_CLASS}>
                Tentukan wewenang peran serta status keaktifan akun.
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label htmlFor="role-pengguna" className={LABEL_CLASS}>
                  Peran / Role *
                </label>
                <div className="relative flex items-center">
                  <select
                    id="role-pengguna"
                    value={role}
                    onChange={(e) =>
                      setRole(e.target.value as "Admin" | "Petugas" | "User")
                    }
                    className={SELECT_CLASS}
                  >
                    <option value="User">User (Siswa / Guru)</option>
                    <option value="Petugas">Petugas Inventaris</option>
                    <option value="Admin">Administrator</option>
                  </select>
                </div>
                <p className="mt-1.5 text-xs text-zinc-500">
                  Admin dapat mengelola seluruh barang, jenis barang, dan akun.
                </p>
              </div>

              <div>
                <label htmlFor="status-pengguna" className={LABEL_CLASS}>
                  <Activity size={14} className="text-cyan-400" />
                  Status Akun *
                </label>
                <div className="relative flex items-center">
                  <select
                    id="status-pengguna"
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as "Active" | "Inactive")
                    }
                    className={SELECT_CLASS}
                  >
                    <option value="Active">Active (Dapat Login)</option>
                    <option value="Inactive">Inactive (Dibekukan)</option>
                  </select>
                </div>
                <p className="mt-1.5 text-xs text-zinc-500">
                  Akun yang non-aktif (Inactive) akan ditolak saat mencoba login.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* ACTIONS MOBILE */}
        <div className="flex items-center gap-3 pb-8 sm:hidden">
          <Button
            type="button"
            onPress={() => router.push("/admin/pengguna")}
            className="h-12 flex-1 rounded-xl border border-zinc-700 bg-transparent px-5 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-800"
          >
            Batal
          </Button>
          <Button
            type="submit"
            isDisabled={!isValid || isSubmitting}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 text-sm font-semibold text-[#08181a] transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} strokeWidth={2.2} />
            )}
            {isSubmitting ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </form>
    </main>
  );
}

export default function HalPenggunaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
          <Loader2 className="animate-spin text-cyan-400" size={32} />
          <p className="text-sm text-zinc-400">Memuat formulir...</p>
        </div>
      }
    >
      <FormPenggunaContent />
    </Suspense>
  );
}
