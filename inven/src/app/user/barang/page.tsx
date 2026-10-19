"use client";

import { Button, Card } from "@heroui/react";
import {
  Boxes,
  Package,
  PackageCheck,
  PackageX,
  Search,
  X,
  Loader2,
} from "lucide-react";
import { useMemo, useState, useEffect, useCallback } from "react";
import { toast } from "@/src/lib/toast";

interface InventoryUnit {
  id: string;
  serialNumber: string;
  status: string;
  kondisi: string;
}

interface InventoryItem {
  id: string;
  nama: string;
  kategori: {
    id: string;
    nama: string;
  };
  sku: string;
  merek?: string;
  stok: number;
  totalUnit?: number;
  tersediaCount?: number;
  units?: InventoryUnit[];
  status: string;
  lokasiRak?: string;
  deskripsi?: string;
}

function todayPlus(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

const minDate = todayPlus(1);

export default function PeminjamanBarangPage() {
  const [data, setData] = useState<InventoryItem[]>([]);
  const [kategoriList, setKategoriList] = useState<string[]>(["Semua"]);
  const [kategoriAktif, setKategoriAktif] = useState("Semua");
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Dialog state
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [tanggalKembali, setTanggalKembali] = useState(minDate);
  const [catatan, setCatatan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const [resBarang, resKategori] = await Promise.all([
        fetch("/api/barang"),
        fetch("/api/jenisbarang"),
      ]);

      const dataBarang = await resBarang.json();
      const dataKategori = await resKategori.json();

      if (Array.isArray(dataBarang.data)) {
        setData(dataBarang.data);
      }
      if (Array.isArray(dataKategori.data)) {
        setKategoriList(["Semua", ...dataKategori.data.map((k: { nama: string }) => k.nama)]);
      }
    } catch {
      toast.error("Terjadi kesalahan", "Tidak dapat memuat katalog barang");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchItems();
  }, [fetchItems]);

  const totalItems = data.length;
  const totalKategori = kategoriList.length - 1;
  const tersediaCount = data.filter((item) => item.stok > 0).length;
  const habisCount = data.filter((item) => item.stok <= 0).length;

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const namaKategori = item.kategori?.nama || "Umum";
      const matchKategori =
        kategoriAktif === "Semua" || namaKategori === kategoriAktif;
      const matchQuery =
        item.nama.toLowerCase().includes(query.toLowerCase()) ||
        item.sku.toLowerCase().includes(query.toLowerCase());
      return matchKategori && matchQuery;
    });
  }, [data, kategoriAktif, query]);

  const statCards = [
    {
      label: "Total Barang",
      value: totalItems.toLocaleString("id-ID"),
      icon: Package,
      tone: "cyan" as const,
    },
    {
      label: "Total Kategori",
      value: totalKategori.toLocaleString("id-ID"),
      icon: Boxes,
      tone: "neutral" as const,
    },
    {
      label: "Tersedia Dipinjam",
      value: tersediaCount.toLocaleString("id-ID"),
      icon: PackageCheck,
      tone: "emerald" as const,
    },
    {
      label: "Stok Habis",
      value: habisCount.toLocaleString("id-ID"),
      icon: PackageX,
      tone: "red" as const,
    },
  ];

  const TONE_STYLE: Record<string, string> = {
    cyan: "bg-cyan-500/15 text-cyan-400",
    neutral: "bg-zinc-700/50 text-zinc-300",
    emerald: "bg-emerald-500/15 text-emerald-400",
    red: "bg-red-500/15 text-red-400",
  };

  const openPinjamDialog = (item: InventoryItem) => {
    setSelectedItem(item);
    setSelectedUnitId("");
    setTanggalKembali(minDate);
    setCatatan("");
  };

  const closePinjamDialog = () => {
    if (isSubmitting) return;
    setSelectedItem(null);
  };

  const submitPeminjaman = async () => {
    if (!selectedItem) return;

    if (!tanggalKembali) {
      toast.error("Batas tanggal pengembalian wajib ditentukan");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/transaksi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barangId: selectedItem.id,
          unitId: selectedUnitId || undefined,
          jumlah: 1,
          tenggatWaktu: tanggalKembali,
          keperluan: catatan,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error("Gagal mengajukan peminjaman", result.error);
        setIsSubmitting(false);
        return;
      }

      toast.success(
        "Pengajuan Terkirim",
        result.message || "Peminjaman berhasil diajukan",
      );

      setSelectedItem(null);
      fetchItems();
    } catch {
      toast.error("Terjadi kesalahan", "Tidak dapat memproses pengajuan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="space-y-8 px-5 py-7 lg:px-8">
      {/* PAGE HEADER */}
      <section>
        <h2 className="text-3xl font-bold tracking-tight text-zinc-100">
          Katalog & Peminjaman Barang
        </h2>
        <p className="mt-1.5 text-sm text-zinc-400">
          Pilih barang yang tersedia dan ajukan peminjaman untuk kebutuhan kegiatan sekolah.
        </p>
      </section>

      {/* STATISTIK */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className="rounded-2xl border border-zinc-800 bg-[#181919] p-5 shadow-none"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${TONE_STYLE[stat.tone]}`}
                >
                  <Icon size={20} strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-zinc-100">
                    {stat.value}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </section>

      {/* SEARCH & FILTER */}
      <Card className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-[#181919] p-4 shadow-none sm:flex-row sm:items-center sm:justify-between">
        <div className="flex h-11 items-center gap-3 rounded-xl border border-zinc-700 bg-[#101111] px-4 transition-colors focus-within:border-cyan-500 sm:max-w-md sm:flex-1">
          <Search size={18} className="shrink-0 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama barang atau SKU..."
            className="h-full w-full bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={kategoriAktif}
            onChange={(e) => setKategoriAktif(e.target.value)}
            className="h-11 rounded-xl border border-zinc-700 bg-[#101111] px-4 text-sm text-zinc-300 outline-none cursor-pointer focus:border-cyan-500"
          >
            {kategoriList.map((kat) => (
              <option key={kat} value={kat} className="bg-[#181919] text-zinc-200">
                {kat === "Semua" ? "Semua Kategori" : kat}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* DAFTAR BARANG */}
      <Card className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#181919] shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full min-w-180 border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-white/1.5">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Nama Barang
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Kategori
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  SKU / Lokasi
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Ketersediaan
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="animate-spin text-cyan-400" size={28} />
                      <p className="text-sm text-zinc-400">Memuat katalog barang...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    Tidak ada barang yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => {
                  const isAvailable = item.stok > 0 && item.status !== "HABIS";
                  return (
                    <tr
                      key={item.id}
                      className="transition-colors hover:bg-white/2"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-zinc-400 border border-zinc-700">
                            <Package size={20} />
                          </div>
                          <div>
                            <p className="font-medium text-zinc-200">{item.nama}</p>
                            {item.merek && (
                              <p className="text-xs text-zinc-500">{item.merek}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span className="inline-flex rounded-lg bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300">
                          {item.kategori?.nama || "Umum"}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-zinc-400">
                        <p className="font-mono text-xs">{item.sku}</p>
                        <p className="text-xs text-zinc-500">
                          {item.lokasiRak || "Gudang Utama"}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        {item.totalUnit !== undefined && item.totalUnit > 0 ? (
                          <div className="flex flex-col">
                            <span className="font-semibold text-zinc-200">
                              {item.tersediaCount} / {item.totalUnit} Unit
                            </span>
                            <span className="text-[11px] text-emerald-400">
                              {isAvailable ? `${item.tersediaCount} Siap Dipinjam` : "Semua Dipinjam"}
                            </span>
                          </div>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
                              isAvailable
                                ? "border-emerald-900/50 bg-emerald-950/30 text-emerald-400"
                                : "border-red-900/50 bg-red-950/30 text-red-400"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isAvailable ? "bg-emerald-400" : "bg-red-400"
                              }`}
                            />
                            {isAvailable ? `Tersedia (${item.stok})` : "Habis"}
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Button
                          size="sm"
                          onPress={() => openPinjamDialog(item)}
                          isDisabled={!isAvailable}
                          className="h-9 rounded-xl bg-cyan-500 px-4 text-xs font-semibold text-[#08181a] transition hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Pinjam
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL PENGAJUAN PINJAM */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-[#181919] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Ajukan Peminjaman
                </h3>
                <p className="text-xs text-zinc-400">{selectedItem.nama}</p>
              </div>
              <button
                type="button"
                onClick={closePinjamDialog}
                className="text-zinc-500 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {/* NOMOR SERI UNIT */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Unit Fisik (Nomor Seri)
                </label>
                <select
                  value={selectedUnitId}
                  onChange={(e) => setSelectedUnitId(e.target.value)}
                  className="h-11 w-full rounded-xl border border-zinc-700 bg-[#0f1010] px-4 text-sm text-zinc-200 outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="">Otomatis (Pilihkan unit yang tersedia)</option>
                  {(selectedItem.units || [])
                    .filter((u) => u.status === "TERSEDIA")
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.serialNumber} (Kondisi: {u.kondisi})
                      </option>
                    ))}
                </select>
                <p className="mt-1 text-[11px] text-zinc-500">
                  Setiap peminjaman adalah 1 unit fisik dengan nomor seri spesifik.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Batas Waktu Pengembalian
                </label>
                <input
                  type="date"
                  min={minDate}
                  value={tanggalKembali}
                  onChange={(e) => setTanggalKembali(e.target.value)}
                  className="h-11 w-full rounded-xl border border-zinc-700 bg-[#0f1010] px-4 text-sm text-zinc-200 outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Keperluan / Alasan Peminjaman
                </label>
                <textarea
                  rows={3}
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Misal: Praktikum Fisika kelas XI IPA 2 di Lab..."
                  className="w-full resize-none rounded-xl border border-zinc-700 bg-[#0f1010] px-4 py-2.5 text-sm text-zinc-200 outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-zinc-800 pt-4">
              <Button
                type="button"
                onPress={closePinjamDialog}
                isDisabled={isSubmitting}
                className="h-10 rounded-xl border border-zinc-700 bg-transparent px-4 text-sm text-zinc-300 hover:bg-zinc-800"
              >
                Batal
              </Button>
              <Button
                type="button"
                onPress={submitPeminjaman}
                isDisabled={isSubmitting}
                className="flex h-10 items-center gap-2 rounded-xl bg-cyan-500 px-5 text-sm font-semibold text-[#08181a] hover:bg-cyan-400 disabled:opacity-50"
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                {isSubmitting ? "Mengirim..." : "Kirim Pengajuan"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </main>
  );
}
