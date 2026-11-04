"use client";

import { Card, Button } from "@heroui/react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  RotateCcw,
  Check,
  X,
  Loader2,
  Inbox,
  ShieldCheck,
} from "lucide-react";
import { useMemo, useState, useEffect, useCallback } from "react";
import { toast } from "@/src/lib/toast";

type TransaksiItem = {
  id: string;
  kodeTransaksi: string;
  penggunaId: string;
  pengguna: {
    id: string;
    nama: string;
    email: string;
    role: string;
  };
  barangId: string;
  barang: {
    id: string;
    nama: string;
    sku: string;
    stok: number;
  };
  unitId?: string | null;
  unit?: {
    id: string;
    serialNumber: string;
    kondisi: string;
    lokasiRak?: string | null;
  } | null;
  jumlah: number;
  tanggalPinjam: string;
  tenggatWaktu: string;
  tanggalKembali: string | null;
  keperluan: string | null;
  status: "MENUNGGU" | "DIPINJAM" | "TERLAMBAT" | "DIKEMBALIKAN" | "DITOLAK" | "DIBATALKAN";
};

function getInitials(name: string): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return isoDate;
  }
}

export default function PetugasKelolaTransaksiPage() {
  const [data, setData] = useState<TransaksiItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchTransaksi = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/transaksi");
      const result = await res.json();
      if (res.ok && Array.isArray(result.data)) {
        setData(result.data);
      } else {
        toast.error("Gagal memuat transaksi", result.error);
      }
    } catch {
      toast.error("Terjadi kesalahan", "Tidak dapat terhubung ke server");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTransaksi();
  }, [fetchTransaksi]);

  // Aksi Update Status (Setujui / Tolak / Kembalikan)
  const handleUpdateStatus = async (
    id: string,
    nextStatus: string,
    successMessage: string
  ) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/transaksi/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error("Gagal memperbarui status", result.error);
        return;
      }

      toast.success("Berhasil", successMessage);
      fetchTransaksi();
    } catch {
      toast.error("Terjadi kesalahan", "Tidak dapat terhubung ke server");
    } finally {
      setUpdatingId(null);
    }
  };

  // Ringkasan Statistik
  const menungguCount = data.filter((t) => t.status === "MENUNGGU").length;
  const dipinjamCount = data.filter((t) => t.status === "DIPINJAM").length;
  const kembaliCount = data.filter((t) => t.status === "DIKEMBALIKAN").length;
  const ditolakCount = data.filter(
    (t) => t.status === "DITOLAK" || t.status === "DIBATALKAN"
  ).length;

  const statCards = [
    {
      label: "Menunggu Persetujuan",
      value: menungguCount,
      icon: Clock,
      tone: "amber" as const,
      highlight: menungguCount > 0,
      filterKey: "MENUNGGU",
    },
    {
      label: "Sedang Dipinjam",
      value: dipinjamCount,
      icon: RotateCcw,
      tone: "cyan" as const,
      filterKey: "DIPINJAM",
    },
    {
      label: "Telah Dikembalikan",
      value: kembaliCount,
      icon: CheckCircle2,
      tone: "emerald" as const,
      filterKey: "DIKEMBALIKAN",
    },
    {
      label: "Ditolak / Dibatalkan",
      value: ditolakCount,
      icon: X,
      tone: "neutral" as const,
      filterKey: "DITOLAK",
    },
  ];

  const TONE_STYLE = {
    amber: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    cyan: "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30",
    emerald: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    neutral: "bg-zinc-800 text-zinc-300 border border-zinc-700",
  };

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchQuery =
        item.kodeTransaksi.toLowerCase().includes(query.toLowerCase()) ||
        item.pengguna.nama.toLowerCase().includes(query.toLowerCase()) ||
        item.barang.nama.toLowerCase().includes(query.toLowerCase()) ||
        (item.unit?.serialNumber &&
          item.unit.serialNumber.toLowerCase().includes(query.toLowerCase()));

      let matchStatus = true;
      if (selectedStatus === "ALL") {
        matchStatus = true;
      } else if (selectedStatus === "DITOLAK") {
        matchStatus = item.status === "DITOLAK" || item.status === "DIBATALKAN";
      } else {
        matchStatus = item.status === selectedStatus;
      }

      return matchQuery && matchStatus;
    });
  }, [data, query, selectedStatus]);

  const renderStatusBadge = (status: TransaksiItem["status"]) => {
    switch (status) {
      case "MENUNGGU":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400">
            <Clock size={13} />
            Menunggu Persetujuan
          </span>
        );
      case "DIPINJAM":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-400">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Sedang Dipinjam
          </span>
        );
      case "TERLAMBAT":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-400">
            <AlertTriangle size={13} />
            Terlambat
          </span>
        );
      case "DIKEMBALIKAN":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
            <CheckCircle2 size={13} />
            Dikembalikan
          </span>
        );
      case "DITOLAK":
      case "DIBATALKAN":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800/50 px-2.5 py-1 text-xs font-semibold text-zinc-400">
            <X size={13} />
            {status === "DITOLAK" ? "Ditolak" : "Dibatalkan"}
          </span>
        );
    }
  };

  return (
    <main className="space-y-8 px-5 py-7 lg:px-8">
      {/* HEADER */}
      <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-cyan-400/10 p-1.5 text-cyan-400">
              <ShieldCheck size={20} />
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Persetujuan Peminjaman
            </h2>
          </div>
          <p className="mt-1.5 text-sm text-zinc-400">
            Tinjau, setujui, atau tolak permohonan peminjaman barang dari user, serta proses pengembalian unit fisik inventaris.
          </p>
        </div>

        {menungguCount > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-300">
            <Clock size={16} className="shrink-0" />
            <span>
              Ada <strong>{menungguCount}</strong> permohonan pinjaman menunggu persetujuan Anda
            </span>
          </div>
        )}
      </section>

      {/* STAT CARDS */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const isSelected = selectedStatus === stat.filterKey;

          return (
            <Card
              key={stat.label}
              onClick={() =>
                setSelectedStatus(isSelected ? "ALL" : stat.filterKey)
              }
              className={`cursor-pointer rounded-2xl border p-4 shadow-none transition-all duration-200 hover:-translate-y-0.5 ${
                isSelected
                  ? "border-cyan-400 bg-cyan-950/20"
                  : stat.highlight
                  ? "border-amber-500/40 bg-[#181919]"
                  : "border-zinc-800 bg-[#181919] hover:border-zinc-700"
              }`}
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
                  <p className="text-2xl font-bold tracking-tight text-white">
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
          {[
            { key: "ALL", label: "Semua Transaksi", count: data.length },
            { key: "MENUNGGU", label: "Menunggu", count: menungguCount },
            { key: "DIPINJAM", label: "Dipinjam", count: dipinjamCount },
            { key: "DIKEMBALIKAN", label: "Dikembalikan", count: kembaliCount },
            { key: "DITOLAK", label: "Ditolak / Batal", count: ditolakCount },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSelectedStatus(tab.key)}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                selectedStatus === tab.key
                  ? "bg-cyan-500 text-[#08181a]"
                  : "border border-zinc-800 bg-[#181919] text-zinc-400 hover:border-zinc-700 hover:text-white"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                  selectedStatus === tab.key
                    ? "bg-[#08181a]/20 text-[#08181a]"
                    : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* SEARCH BAR */}
        <div className="flex h-11 items-center gap-3 rounded-xl border border-zinc-700 bg-[#181919] px-4 transition-colors focus-within:border-cyan-500 sm:w-80">
          <Search size={18} className="shrink-0 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari kode, peminjam, barang..."
            className="h-full w-full bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
          />
        </div>
      </section>

      {/* TABEL PERSETUJUAN TRANSAKSI */}
      <Card className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#181919] shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full min-w-180 border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-[#121313] text-xs font-semibold uppercase tracking-wider text-zinc-400">
                <th className="px-6 py-4 align-middle text-left">Kode / Keperluan</th>
                <th className="px-6 py-4 align-middle text-left">Peminjam</th>
                <th className="px-6 py-4 align-middle text-left">Barang</th>
                <th className="px-6 py-4 align-middle text-left">Jadwal Pinjam</th>
                <th className="px-6 py-4 align-middle text-left">Status</th>
                <th className="px-6 py-4 align-middle text-center">Tindakan Persetujuan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center align-middle">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="animate-spin text-cyan-400" size={28} />
                      <p className="text-sm text-zinc-400">
                        Memuat data transaksi...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-zinc-500 align-middle">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Inbox size={32} className="text-zinc-600" />
                      <p className="text-sm font-medium text-zinc-400">
                        Tidak ada transaksi peminjaman yang cocok.
                      </p>
                      {selectedStatus === "MENUNGGU" && (
                        <p className="text-xs text-zinc-500">
                          Bagus! Tidak ada permohonan baru yang tertunda.
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-white/[0.02]"
                  >
                    {/* KODE */}
                    <td className="px-6 py-4 align-middle text-left">
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-xs font-bold text-cyan-400">
                          {item.kodeTransaksi}
                        </span>
                        {item.keperluan && (
                          <p className="line-clamp-2 max-w-[200px] text-xs text-zinc-400 italic">
                            &quot;{item.keperluan}&quot;
                          </p>
                        )}
                      </div>
                    </td>

                    {/* PEMINJAM */}
                    <td className="px-6 py-4 align-middle text-left">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-xs font-bold text-cyan-400">
                          {getInitials(item.pengguna.nama)}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-zinc-200">
                            {item.pengguna.nama}
                          </span>
                          <span className="text-xs text-zinc-500 truncate max-w-[180px]">
                            {item.pengguna.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* BARANG */}
                    <td className="px-6 py-4 align-middle text-left">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-zinc-200">
                          {item.barang.nama}
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs text-zinc-500">
                            SKU: {item.barang.sku}
                          </span>
                          {item.unit?.serialNumber ? (
                            <span className="inline-flex items-center gap-1 rounded border border-cyan-800/40 bg-cyan-950/60 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-cyan-400">
                              SN: {item.unit.serialNumber}
                            </span>
                          ) : (
                            <span className="text-xs text-zinc-500">
                              • 1 Unit Fisik
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* TANGGAL */}
                    <td className="px-6 py-4 align-middle text-left">
                      <div className="flex flex-col gap-0.5 text-xs">
                        <span className="text-zinc-400">
                          Pinjam: <span className="text-zinc-300 font-medium">{formatDate(item.tanggalPinjam)}</span>
                        </span>
                        <span className="text-amber-400/90 font-medium">
                          Batas: <span>{formatDate(item.tenggatWaktu)}</span>
                        </span>
                        {item.tanggalKembali && (
                          <span className="text-emerald-400 font-medium">
                            Kembali: <span>{formatDate(item.tanggalKembali)}</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* STATUS */}
                    <td className="px-6 py-4 align-middle text-left">
                      <div className="flex items-center">
                        {renderStatusBadge(item.status)}
                      </div>
                    </td>

                    {/* AKSI PERSETUJUAN */}
                    <td className="px-6 py-4 align-middle text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Jika MENUNGGU -> Tombol SETUJUI & TOLAK */}
                        {item.status === "MENUNGGU" && (
                          <>
                            <Button
                              size="sm"
                              onPress={() =>
                                handleUpdateStatus(
                                  item.id,
                                  "DIPINJAM",
                                  "Peminjaman disetujui, stok barang dikurangi"
                                )
                              }
                              isDisabled={updatingId === item.id}
                              className="flex h-8 items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 text-xs font-bold text-emerald-400 hover:bg-emerald-500/25"
                            >
                              <Check size={14} strokeWidth={2.5} />
                              Setujui
                            </Button>
                            <Button
                              size="sm"
                              onPress={() =>
                                handleUpdateStatus(
                                  item.id,
                                  "DITOLAK",
                                  "Peminjaman ditolak"
                                )
                              }
                              isDisabled={updatingId === item.id}
                              className="flex h-8 items-center gap-1.5 rounded-lg bg-red-500/15 px-3 text-xs font-bold text-red-400 hover:bg-red-500/25"
                            >
                              <X size={14} strokeWidth={2.5} />
                              Tolak
                            </Button>
                          </>
                        )}

                        {/* Jika DIPINJAM atau TERLAMBAT -> Tombol KEMBALIKAN */}
                        {(item.status === "DIPINJAM" ||
                          item.status === "TERLAMBAT") && (
                          <Button
                            size="sm"
                            onPress={() =>
                              handleUpdateStatus(
                                item.id,
                                "DIKEMBALIKAN",
                                "Barang berhasil dikembalikan, stok dipulihkan"
                              )
                            }
                            isDisabled={updatingId === item.id}
                            className="flex h-8 items-center gap-1.5 rounded-lg bg-cyan-500/15 px-3 text-xs font-semibold text-cyan-400 hover:bg-cyan-500/25"
                          >
                            <RotateCcw size={14} strokeWidth={2.2} />
                            Kembalikan
                          </Button>
                        )}

                        {/* Jika SUDAH SELESAI */}
                        {item.status === "DIKEMBALIKAN" && (
                          <span className="text-xs text-zinc-500">
                            Selesai dikembalikan
                          </span>
                        )}

                        {(item.status === "DITOLAK" ||
                          item.status === "DIBATALKAN") && (
                          <span className="text-xs text-zinc-500">
                            Tidak aktif
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  );
}
