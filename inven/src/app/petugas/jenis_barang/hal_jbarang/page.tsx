"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Card } from "@heroui/react";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { toast } from "@/src/lib/toast";

function FormJenisBarangPetugasContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const editId = searchParams.get("id");
  const isEditMode = !!editId;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditMode);
  const [formData, setFormData] = useState({
    nama: "",
    deskripsi: "",
  });

  useEffect(() => {
    if (!editId) return;

    const fetchDetail = async () => {
      setIsFetching(true);
      try {
        const res = await fetch(`/api/jenisbarang/${editId}`);
        const result = await res.json();

        if (!res.ok) {
          toast.error("Gagal memuat data", result.error);
          router.push("/petugas/jenis_barang");
          return;
        }

        setFormData({
          nama: result.data.nama,
          deskripsi: result.data.deskripsi || "",
        });
      } catch {
        toast.error("Terjadi kesalahan", "Tidak dapat terhubung ke server");
        router.push("/petugas/jenis_barang");
      } finally {
        setIsFetching(false);
      }
    };

    fetchDetail();
  }, [editId, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const payload = {
      nama: formData.nama.trim(),
      deskripsi: formData.deskripsi.trim(),
    };

    try {
      const res = await fetch(
        isEditMode ? `/api/jenisbarang/${editId}` : "/api/jenisbarang",
        {
          method: isEditMode ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const result = await res.json();

      if (!res.ok) {
        toast.error(
          isEditMode
            ? "Gagal menyimpan perubahan"
            : "Gagal menambah jenis barang",
          result.error,
        );
        setIsLoading(false);
        return;
      }

      toast.success(
        isEditMode ? "Perubahan disimpan" : "Jenis barang ditambahkan",
        `${payload.nama} berhasil disimpan`,
      );
      router.push("/petugas/jenis_barang");
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan", "Tidak dapat terhubung ke server");
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-cyan-400" size={32} />
        <p className="text-sm text-zinc-400">Memuat data kategori...</p>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-5 py-7 lg:px-8">
      {/* HEADER */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/petugas/jenis_barang")}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-700 bg-[#181919] text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-100 cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">
              {isEditMode ? "Edit Jenis Barang" : "Tambah Jenis Barang"}
            </h2>
            <p className="mt-1 text-xs text-zinc-500 sm:text-sm">
              {isEditMode
                ? "Perbarui informasi nama atau deskripsi kategori barang."
                : "Tambahkan kelompok kategori baru untuk inventaris sekolah."}
            </p>
          </div>
        </div>

        <button
          type="submit"
          form="form-jenis-barang"
          disabled={isLoading}
          className="flex h-11 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 text-sm font-semibold text-[#08181a] transition hover:bg-cyan-400 disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Save size={18} />
          )}
          <span>{isLoading ? "Menyimpan..." : "Simpan Kategori"}</span>
        </button>
      </section>

      {/* FORM CARD */}
      <Card className="rounded-2xl border border-zinc-800 bg-[#181919] p-6 shadow-none">
        <form id="form-jenis-barang" onSubmit={handleSubmit} className="space-y-6">
          {/* NAMA JENIS */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Nama Jenis / Kategori <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="nama"
              required
              value={formData.nama}
              onChange={handleChange}
              placeholder="Contoh: Elektronik, Olahraga, Buku..."
              className="h-11 w-full rounded-xl border border-zinc-700 bg-[#101111] px-4 text-sm text-zinc-200 outline-none transition focus:border-cyan-500"
            />
          </div>

          {/* DESKRIPSI */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Deskripsi Singkat (Opsional)
            </label>
            <textarea
              name="deskripsi"
              rows={4}
              value={formData.deskripsi}
              onChange={handleChange}
              placeholder="Berikan keterangan singkat mengenai kategori barang ini..."
              className="w-full rounded-xl border border-zinc-700 bg-[#101111] p-4 text-sm text-zinc-200 outline-none transition focus:border-cyan-500"
            />
          </div>
        </form>
      </Card>
    </main>
  );
}

export default function PetugasHalJenisBarangPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
          <Loader2 className="animate-spin text-cyan-400" size={32} />
          <p className="text-sm text-zinc-400">Memuat formulir...</p>
        </div>
      }
    >
      <FormJenisBarangPetugasContent />
    </Suspense>
  );
}
