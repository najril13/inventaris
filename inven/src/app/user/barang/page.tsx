"use client";

import { Button, Card } from "@heroui/react";
import {
  Boxes,
  Package,
  PackageCheck,
  Search,
  X,
  Loader2,
  Clock,
  RotateCcw,
  ShieldAlert,
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
  activeTx?: {
    id: string;
    kodeTransaksi: string;
    status: string;
    peminjamNama: string;
    tenggatWaktu: string;
  } | null;
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
        setKategoriList([
          "Semua",
          ...dataKategori.data.map((k: { nama: string }) => k.nama),
        ]);
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
  const tersediaCount = data.filter(
    (item) => item.status === "TERSEDIA" && item.stok > 0
  ).length;
  const dipinjamCount = data.filter(
    (item) => item.status === "DIPINJAM" || item.stok <= 0
  ).length;

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
      label: "Sedang Dipinjam",
      value: dipinjamCount.toLocaleString("id-ID"),
      icon: RotateCcw,
      tone: "red" as const,
    },
  ];

  const TONE_STYLE: Record<string, string> = {
    cyan: "bg-cyan-500/15 text-cyan-400",
    neutral: "bg-zinc-700/50 text-zinc-300",
    emerald: "bg-emerald-500/15 text-emerald-400",
    red: "bg-amber-500/15 text-amber-400",
  };

  const openPinjamDialog = (item: InventoryItem) => {
    setSelectedItem(item);
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
        "Permohonan Terkirim",
        result.message || "Peminjaman berhasil diajukan, menunggu persetujuan Petugas atau Admin"
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
          Setiap barang fisik hanya tersedia 1 unit. Ajukan peminjaman dan tunggu persetujuan petugas sebelum barang dapat digunakan.
        </p>
      </section>

      {/* STATISTIK */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className="rounded-2xl border border-zinc-800 bg-[#181919] p-4 shadow-none"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    TONE_STYLE[stat.tone]
                  }`}
                >
                  <Icon size={18} strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-zinc-400">
                    {stat.label}
                  </p>
                  <p className="text-xl font-bold tracking-tight text-white">
                    {stat.value}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </section>

      {/* FILTER & PENCARIAN */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {kategoriList.map((kat) => (
            <button
              key={kat}
              type="button"
              onClick={() => setKategoriAktif(kat)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                kategoriAktif === kat
                  ? "bg-cyan-500 text-[#08181a]"
                  : "border border-zinc-800 bg-[#181919] text-zinc-400 hover:border-zinc-700 hover:text-white"
              }`}
            >
              {kat}
            </button>
          ))}
        </div>

        <div className="flex h-11 items-center gap-3 rounded-xl border border-zinc-700 bg-[#181919] px-4 transition-colors focus-within:border-cyan-500 sm:w-72">
          <Search size={18} className="shrink-0 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama barang atau SKU..."
            className="h-full w-full bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
          />
        </div>
      </section>

      {/* KATALOG TABLE */}
      <Card className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#181919] shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full min-w-180 border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-[#151616] text-xs font-semibold uppercase tracking-wider text-zinc-400">
                <th className="px-6 py-4 align-middle text-left">Nama Barang</th>
                <th className="px-5 py-4 align-middle text-left">Kategori</th>
                <th className="px-5 py-4 align-middle text-left">SKU / Lokasi</th>
                <th className="px-5 py-4 align-middle text-left">Status Ketersediaan</th>
                <th className="px-6 py-4 align-middle text-right">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center align-middle">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="animate-spin text-cyan-400" size={28} />
                      <p className="text-sm text-zinc-400">
                        Memuat katalog barang...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 align-middle">
                    Tidak ada barang yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => {
                  const isAvailable =
                    item.status === "TERSEDIA" && item.stok > 0;
                  const isDipinjam =
                    item.status === "DIPINJAM" || item.stok <= 0;
                  const isMenunggu = item.status === "MENUNGGU";

                  return (
                    <tr
                      key={item.id}
                      className="transition-colors hover:bg-white/2"
                    >
                      <td className="px-6 py-4 align-middle text-left">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-700/80 bg-zinc-800/80 text-zinc-400">
                            <Package size={20} className="text-cyan-400" />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <p className="font-semibold text-zinc-100">
                              {item.nama}
                            </p>
                            {item.merek && (
                              <p className="text-xs text-zinc-500">
                                {item.merek}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 align-middle text-left">
                        <span className="inline-flex rounded-full border border-zinc-700 bg-zinc-800/60 px-2.5 py-1 text-xs font-medium text-zinc-300">
                          {item.kategori?.nama || "Umum"}
                        </span>
                      </td>

                      <td className="px-5 py-4 align-middle text-left text-zinc-400">
                        <div className="flex flex-col gap-0.5">
                          <p className="font-mono text-xs text-zinc-300">{item.sku}</p>
                          <p className="text-xs text-zinc-500">
                            {item.lokasiRak || "Gudang Utama"}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4 align-middle text-left">
                        {isAvailable && (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-900/50 bg-emerald-950/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                              Tersedia (1 Unit)
                            </span>
                            <span className="text-[11px] text-zinc-500">
                              Siap diajukan pinjam
                            </span>
                          </div>
                        )}

                        {isDipinjam && (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-red-900/50 bg-red-950/30 px-2.5 py-0.5 text-xs font-semibold text-red-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                              Sedang Dipinjam
                            </span>
                            <span className="text-[11px] text-zinc-500">
                              Menunggu dikembalikan
                            </span>
                          </div>
                        )}

                        {isMenunggu && (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-amber-900/50 bg-amber-950/30 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
                              <Clock size={12} />
                              Menunggu Persetujuan
                            </span>
                            <span className="text-[11px] text-zinc-500">
                              Sedang dalam permohonan
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 align-middle text-right">
                        <div className="flex items-center justify-end">
                          {isAvailable ? (
                            <Button
                              size="sm"
                              onPress={() => openPinjamDialog(item)}
                              className="h-9 rounded-xl bg-cyan-500 px-4 text-xs font-semibold text-[#08181a] transition hover:bg-cyan-400 cursor-pointer shadow-sm"
                            >
                              Pinjam Barang
                            </Button>
                          ) : isDipinjam ? (
                            <Button
                              size="sm"
                              isDisabled
                              className="h-9 rounded-xl bg-zinc-800 px-3.5 text-xs font-medium text-zinc-500 cursor-not-allowed opacity-60"
                            >
                              Sedang Dipinjam
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              isDisabled
                              className="h-9 rounded-xl bg-amber-950/40 border border-amber-800/40 px-3.5 text-xs font-medium text-amber-400 cursor-not-allowed opacity-75"
                            >
                              Dalam Antrean
                            </Button>
                          )}
                        </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-[#181919] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Ajukan Peminjaman Barang
                </h3>
                <p className="text-xs text-zinc-400">
                  {selectedItem.nama} ({selectedItem.sku})
                </p>
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
              {/* NOTICE 1 UNIT & APPROVAL */}
              <div className="flex items-start gap-3 rounded-xl border border-cyan-800/40 bg-cyan-950/20 p-3.5 text-xs text-cyan-300">
                <ShieldAlert size={18} className="shrink-0 text-cyan-400 mt-0.5" />
                <p>
                  Barang ini merupakan <strong>1 unit fisik</strong> inventaris. Setelah diajukan, permohonan harus <strong>disetujui oleh Petugas atau Admin</strong> terlebih dahulu sebelum barang dapat diambil.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Batas Waktu Pengembalian <span className="text-red-400">*</span>
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
                  placeholder="Misal: Praktikum di Lab, kegiatan OSIS, atau tugas sekolah..."
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
                className="flex h-10 items-center gap-2 rounded-xl bg-cyan-500 px-5 text-sm font-semibold text-[#08181a] hover:bg-cyan-400 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                {isSubmitting ? "Mengirim..." : "Ajukan Peminjaman"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </main>
  );
}
