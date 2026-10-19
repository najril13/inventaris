"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Card } from "@heroui/react";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { toast } from "@/src/lib/toast";

function FormJenisBarangContent() {
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
          router.push("/admin/jenis_barang");
          return;
        }

        setFormData({
          nama: result.data.nama,
          deskripsi: result.data.deskripsi || "",
        });
      } catch {
        toast.error("Terjadi kesalahan", "Tidak dapat terhubung ke server");
        router.push("/admin/jenis_barang");
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
      router.push("/admin/jenis_barang");
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan", "Tidak dapat terhubung ke server");
      setIsLoading(false);
    }
  };

  return (
    // DI SINI PERUBAHANNYA: mx-auto untuk ke tengah, max-w-4xl untuk memperbesar area
    <div className="mx-auto max-w-4xl space-y-8">
      {/* HEADER */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-700 bg-[#181919] text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-100">
            {isEditMode ? "Edit Jenis Barang" : "Tambah Jenis Barang"}
          </h2>
          <p className="mt-1.5 text-sm text-zinc-500">
            {isEditMode
              ? `Memperbarui data untuk kategori dengan ID: ${editId}`
              : "Tambahkan klasifikasi kategori baru untuk manajemen barang."}
          </p>
        </div>
      </div>

      {/* FORM CARD */}
      {/* max-w dihapus dan diganti w-full agar mengikuti lebar max-w-4xl di atas */}
      <Card className="w-full rounded-2xl border border-zinc-800 bg-[#181919] p-6 shadow-none md:p-10">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <h3 className="border-b border-zinc-800 pb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Informasi Kategori
            </h3>

            {isFetching ? (
              <p className="py-8 text-center text-sm text-zinc-500">
                Memuat data...
              </p>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {/* NAMA JENIS BARANG */}
                <div className="col-span-2">
                  <label className="mb-2 block text-sm font-medium text-zinc-300">
                    Nama Jenis Barang <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nama"
                    value={formData.nama}
                    onChange={handleChange}
                    required
                    placeholder="Misal: Elektronik, Furniture, Alat Tulis"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-200 transition-colors focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                {/* DESKRIPSI */}
                <div className="col-span-2">
                  <label className="mb-2 block text-sm font-medium text-zinc-300">
                    Deskripsi (Opsional)
                  </label>
                  <textarea
                    name="deskripsi"
                    value={formData.deskripsi}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Tuliskan keterangan singkat mengenai jenis barang ini..."
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-200 transition-colors focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ACTIONS */}
          <div className="flex items-center justify-end gap-4 border-t border-zinc-800 pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={isLoading}
              className="rounded-xl bg-zinc-800 px-6 py-2.5 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-700 disabled:opacity-50"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isLoading || isFetching || !formData.nama.trim()}
              className="flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-2.5 text-sm font-semibold text-[#08181a] transition hover:bg-cyan-400 disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save size={18} strokeWidth={2.2} />
                  {isEditMode ? "Simpan Perubahan" : "Simpan Jenis Barang"}
                </>
              )}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function HalJenisBarangPage() {
  return (
    <main className="px-5 py-7 lg:px-8 w-full">
      <Suspense
        fallback={
          <div className="text-zinc-400 text-center mt-10">
            Memuat formulir...
          </div>
        }
      >
        <FormJenisBarangContent />
      </Suspense>
    </main>
  );
}
