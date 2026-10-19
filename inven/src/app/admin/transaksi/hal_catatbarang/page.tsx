"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Card, Button } from "@heroui/react";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useState, useEffect, Suspense, type FormEvent } from "react";
import { toast } from "@/src/lib/toast";

type UserOption = {
  id: string;
  nama: string;
  email: string;
  role: string;
};

type BarangOption = {
  id: string;
  nama: string;
  stok: number;
  totalUnit?: number;
  tersediaCount?: number;
  units?: Array<{
    id: string;
    serialNumber: string;
    status: string;
    kondisi: string;
  }>;
  status: string;
};

function FormTransaksiContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const editId = searchParams.get("id");
  const isEditMode = Boolean(editId);

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const [users, setUsers] = useState<UserOption[]>([]);
  const [barangList, setBarangList] = useState<BarangOption[]>([]);

  const [formData, setFormData] = useState({
    peminjamId: "",
    barangId: "",
    unitId: "",
    jumlah: "1",
    tanggalPinjam: new Date().toISOString().split("T")[0],
    tenggatWaktu: "",
    catatan: "",
    status: "DIPINJAM",
  });

  // Fetch users & barang list
  useEffect(() => {
    async function loadOptions() {
      setIsFetching(true);
      try {
        const [resUsers, resBarang] = await Promise.all([
          fetch("/api/pengguna"),
          fetch("/api/barang"),
        ]);

        const dataUsers = await resUsers.json();
        const dataBarang = await resBarang.json();

        if (Array.isArray(dataUsers.data)) {
          setUsers(dataUsers.data);
        }
        if (Array.isArray(dataBarang.data)) {
          setBarangList(dataBarang.data);
        }

        // Jika mode edit, ambil data transaksi yang ada
        if (editId) {
          const resTx = await fetch(`/api/transaksi/${editId}`);
          const txResult = await resTx.json();
          if (resTx.ok && txResult.data) {
            const tx = txResult.data;
            setFormData({
              peminjamId: tx.penggunaId || "",
              barangId: tx.barangId || "",
              unitId: tx.unitId || "",
              jumlah: "1",
              tanggalPinjam: tx.tanggalPinjam
                ? new Date(tx.tanggalPinjam).toISOString().split("T")[0]
                : "",
              tenggatWaktu: tx.tenggatWaktu
                ? new Date(tx.tenggatWaktu).toISOString().split("T")[0]
                : "",
              catatan: tx.keperluan || tx.catatan || "",
              status: tx.status || "DIPINJAM",
            });
          } else {
            toast.error("Transaksi tidak ditemukan");
            router.push("/admin/transaksi");
          }
        }
      } catch (err) {
        console.error("Error loading form data:", err);
        toast.error("Gagal memuat data formulir");
      } finally {
        setIsFetching(false);
      }
    }

    loadOptions();
  }, [editId, router]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.peminjamId || !formData.barangId || !formData.tenggatWaktu) {
      toast.error("Mohon lengkapi semua field yang berbintang (*)");
      return;
    }

    setIsLoading(true);

    try {
      const url = isEditMode ? `/api/transaksi/${editId}` : "/api/transaksi";
      const method = isEditMode ? "PATCH" : "POST";

      const payload = {
        penggunaId: formData.peminjamId,
        barangId: formData.barangId,
        unitId: formData.unitId || undefined,
        jumlah: 1,
        tanggalPinjam: formData.tanggalPinjam,
        tenggatWaktu: formData.tenggatWaktu,
        keperluan: formData.catatan,
        catatan: formData.catatan,
        status: formData.status,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error("Gagal menyimpan transaksi", result.error || "Terjadi kesalahan");
        setIsLoading(false);
        return;
      }

      toast.success(
        isEditMode ? "Transaksi Diperbarui" : "Peminjaman Dicatat",
        result.message || "Data peminjaman berhasil disimpan",
      );

      router.push("/admin/transaksi");
    } catch {
      toast.error("Terjadi kesalahan", "Tidak dapat terhubung ke server");
      setIsLoading(false);
    }
  };

  const selectedBarang = barangList.find((b) => b.id === formData.barangId);
  const availableUnits = (selectedBarang?.units || []).filter(
    (u) => u.status === "TERSEDIA" || (isEditMode && u.id === formData.unitId),
  );

  if (isFetching) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-cyan-400" size={32} />
        <p className="text-sm text-zinc-400">Memuat data formulir peminjaman...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-7">
      {/* HEADER */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => router.push("/admin/transaksi")}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-700 bg-[#181919] text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-100">
            {isEditMode ? "Edit Transaksi" : "Catat Peminjaman Baru"}
          </h2>
          <p className="mt-1.5 text-sm text-zinc-400">
            {isEditMode
              ? `Memperbarui data transaksi`
              : "Masukkan detail pengeluaran atau peminjaman barang oleh pengguna."}
          </p>
        </div>
      </div>

      {/* FORM CARD */}
      <Card className="w-full rounded-2xl border border-zinc-800 bg-[#181919] p-6 shadow-none md:p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <h3 className="border-b border-zinc-800 pb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
              Detail Peminjaman
            </h3>

            <div className="grid gap-6 md:grid-cols-2">
              {/* PEMINJAM */}
              <div className="col-span-2 md:col-span-1">
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Nama Peminjam <span className="text-red-500">*</span>
                </label>
                <select
                  name="peminjamId"
                  value={formData.peminjamId}
                  onChange={handleChange}
                  required
                  disabled={isEditMode}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-200 transition-colors focus:border-cyan-500 focus:outline-none disabled:opacity-50"
                >
                  <option value="" disabled>
                    -- Pilih Pengguna --
                  </option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nama} ({u.role}) - {u.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* BARANG */}
              <div className="col-span-2 md:col-span-1">
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Barang yang Dipinjam <span className="text-red-500">*</span>
                </label>
                <select
                  name="barangId"
                  value={formData.barangId}
                  onChange={(e) => {
                    setFormData({ ...formData, barangId: e.target.value, unitId: "" });
                  }}
                  required
                  disabled={isEditMode}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-200 transition-colors focus:border-cyan-500 focus:outline-none disabled:opacity-50"
                >
                  <option value="" disabled>
                    -- Pilih Barang --
                  </option>
                  {barangList.map((b) => (
                    <option
                      key={b.id}
                      value={b.id}
                      disabled={b.stok <= 0 && !isEditMode}
                    >
                      {b.nama} (Tersedia: {b.stok})
                    </option>
                  ))}
                </select>
              </div>

              {/* UNIT BARANG (SERIAL NUMBER) */}
              <div className="col-span-2 md:col-span-1">
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Nomor Seri (Unit Fisik)
                </label>
                <select
                  name="unitId"
                  value={formData.unitId}
                  onChange={handleChange}
                  disabled={isEditMode || !formData.barangId}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-200 transition-colors focus:border-cyan-500 focus:outline-none disabled:opacity-50 cursor-pointer"
                >
                  <option value="">-- Otomatis (Pilihkan unit yang tersedia) --</option>
                  {availableUnits.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.serialNumber} (Kondisi: {u.kondisi})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-zinc-500">
                  {availableUnits.length > 0
                    ? `${availableUnits.length} unit nomor seri tersedia`
                    : formData.barangId
                      ? "Tidak ada unit fisik khusus yang terdaftar (otomatis)"
                      : "Pilih barang terlebih dahulu"}
                </p>
              </div>

              {/* JUMLAH PINJAM */}
              <div className="col-span-2 md:col-span-1">
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Jumlah Pinjam
                </label>
                <input
                  type="text"
                  value="1 Unit Fisik (Sesuai Nomor Seri)"
                  disabled
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-400 outline-none cursor-not-allowed"
                />
              </div>

              {/* TANGGAL PINJAM */}
              <div className="col-span-2 md:col-span-1">
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Tanggal Pinjam <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="tanggalPinjam"
                  value={formData.tanggalPinjam}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-200 transition-colors focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {/* TENGGAT WAKTU */}
              <div className="col-span-2 md:col-span-1">
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Batas Waktu Pengembalian <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="tenggatWaktu"
                  value={formData.tenggatWaktu}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-200 transition-colors focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {/* STATUS TRANSAKSI */}
              <div className="col-span-2 md:col-span-1">
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Status Peminjaman
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-200 transition-colors focus:border-cyan-500 focus:outline-none"
                >
                  <option value="DIPINJAM">Dipinjam (Aktif)</option>
                  <option value="DIKEMBALIKAN">Dikembalikan</option>
                  <option value="TERLAMBAT">Terlambat</option>
                  <option value="MENUNGGU">Menunggu Persetujuan</option>
                </select>
              </div>

              {/* CATATAN */}
              <div className="col-span-2">
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Keperluan / Catatan Peminjaman
                </label>
                <textarea
                  name="catatan"
                  rows={4}
                  value={formData.catatan}
                  onChange={handleChange}
                  placeholder="Tuliskan tujuan peminjaman atau catatan barang jika ada..."
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-200 transition-colors focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-col-reverse gap-3 border-t border-zinc-800 pt-6 sm:flex-row sm:justify-end">
            <Button
              type="button"
              onPress={() => router.push("/admin/transaksi")}
              className="h-11 rounded-xl border border-zinc-700 bg-transparent px-6 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-800"
            >
              Batal
            </Button>
            <Button
              type="submit"
              isDisabled={isLoading}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-6 text-sm font-semibold text-[#08181a] transition hover:bg-cyan-400 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} strokeWidth={2.2} />
              )}
              {isLoading ? "Menyimpan..." : "Simpan Peminjaman"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function HalCatatBarangPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
          <Loader2 className="animate-spin text-cyan-400" size={32} />
          <p className="text-sm text-zinc-400">Memuat formulir...</p>
        </div>
      }
    >
      <FormTransaksiContent />
    </Suspense>
  );
}
