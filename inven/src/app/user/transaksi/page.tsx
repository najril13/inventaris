"use client";

import { Card, Button } from "@heroui/react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  RotateCcw,
  Package,
  X,
  Loader2,
} from "lucide-react";
import { useMemo, useState, useEffect, useCallback } from "react";
import { ConfirmDialog } from "@/src/components/kelola_barang/ConfirmDialog";
import { toast } from "@/src/lib/toast";

type TransaksiItem = {
  id: string;
  kodeTransaksi: string;
  barang: {
    id: string;
    nama: string;
    sku: string;
  };
  unitId?: string | null;
  unit?: {
    id: string;
    serialNumber: string;
    kondisi: string;
  } | null;
  jumlah: number;
  tanggalPinjam: string;
  tenggatWaktu: string;
  tanggalKembali: string | null;
  keperluan: string | null;
  status: "MENUNGGU" | "DIPINJAM" | "TERLAMBAT" | "DIKEMBALIKAN" | "DITOLAK" | "DIBATALKAN";
};

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

export default function RiwayatTransaksiSayaPage() {
  const [data, setData] = useState<TransaksiItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // State untuk batalkan
  const [cancelTarget, setCancelTarget] = useState<TransaksiItem | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);

  const fetchTransaksi = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/transaksi");
      const result = await res.json();
      if (res.ok && Array.isArray(result.data)) {
        setData(result.data);
      } else {
        toast.error("Gagal memuat riwayat", result.error);
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

  const handleCancelPeminjaman = async () => {
    if (!cancelTarget) return;

    setIsCanceling(true);
    try {
      const res = await fetch(`/api/transaksi/${cancelTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DIBATALKAN" }),
      });
      const result = await res.json();

      if (!res.ok) {
        toast.error("Gagal membatalkan peminjaman", result.error);
        setIsCanceling(false);
        return;
      }

      toast.success("Berhasil", "Peminjaman berhasil dibatalkan");
      setData((prev) =>
        prev.map((t) =>
          t.id === cancelTarget.id ? { ...t, status: "DIBATALKAN" } : t,
        ),
      );
      setCancelTarget(null);
    } catch {
      toast.error("Terjadi kesalahan", "Tidak dapat terhubung ke server");
    } finally {
      setIsCanceling(false);
    }
  };

  const ringkasan = useMemo(() => {
    const total = data.length;
    const menunggu = data.filter((t) => t.status === "MENUNGGU").length;
    const dipinjam = data.filter((t) => t.status === "DIPINJAM").length;
    const selesai = data.filter((t) => t.status === "DIKEMBALIKAN").length;
    return { total, menunggu, dipinjam, selesai };
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchQuery =
        item.kodeTransaksi.toLowerCase().includes(query.toLowerCase()) ||
        item.barang.nama.toLowerCase().includes(query.toLowerCase()) ||
        Boolean(item.unit?.serialNumber?.toLowerCase().includes(query.toLowerCase()));

      const matchStatus =
        selectedStatus === "ALL" || item.status === selectedStatus;

      return matchQuery && matchStatus;
    });
  }, [data, query, selectedStatus]);

  const renderStatusBadge = (status: TransaksiItem["status"]) => {
    switch (status) {
      case "MENUNGGU":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-900/50 bg-amber-950/30 px-2.5 py-1 text-xs font-medium text-amber-400">
            <Clock size={12} />
            Menunggu Persetujuan
          </span>
        );
      case "DIPINJAM":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-900/50 bg-cyan-950/30 px-2.5 py-1 text-xs font-medium text-cyan-400">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Sedang Dipinjam
          </span>
        );
      case "TERLAMBAT":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-900/50 bg-red-950/30 px-2.5 py-1 text-xs font-medium text-red-400">
            <AlertTriangle size={12} />
            Terlambat
          </span>
        );
      case "DIKEMBALIKAN":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-900/50 bg-emerald-950/30 px-2.5 py-1 text-xs font-medium text-emerald-400">
            <CheckCircle2 size={12} />
            Selesai / Dikembalikan
          </span>
        );
      case "DITOLAK":
      case "DIBATALKAN":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700/50 bg-zinc-800/30 px-2.5 py-1 text-xs font-medium text-zinc-400">
            <X size={12} />
            {status === "DITOLAK" ? "Ditolak" : "Dibatalkan"}
          </span>
        );
    }
  };

  return (
    <main className="space-y-6 px-5 py-7 lg:px-8">
      {/* HEADER */}
      <section>
        <h2 className="text-3xl font-bold tracking-tight text-white">
          Riwayat Peminjaman Saya
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          Pantau status peminjaman dan riwayat pengembalian barang yang telah kamu ajukan.
        </p>
      </section>

      {/* STAT CARDS */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="rounded-2xl border border-zinc-800 bg-[#181919] p-4 shadow-none">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
              <Package size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">Total Pengajuan</p>
              <p className="text-xl font-bold text-white">{ringkasan.total}</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border border-zinc-800 bg-[#181919] p-4 shadow-none">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">Menunggu</p>
              <p className="text-xl font-bold text-white">{ringkasan.menunggu}</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border border-zinc-800 bg-[#181919] p-4 shadow-none">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <RotateCcw size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">Dipinjam</p>
              <p className="text-xl font-bold text-white">{ringkasan.dipinjam}</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border border-zinc-800 bg-[#181919] p-4 shadow-none">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">Dikembalikan</p>
              <p className="text-xl font-bold text-white">{ringkasan.selesai}</p>
            </div>
          </div>
        </Card>
      </section>

      {/* TABLE CONTAINER */}
      <Card className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-[#181919] p-0 shadow-none">
        {/* CONTROLS */}
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex h-11 w-full max-w-md items-center gap-3 rounded-xl border border-zinc-700/60 bg-[#101111] px-4 focus-within:border-cyan-500">
            <Search size={18} className="text-zinc-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari kode, nama barang, atau serial number..."
              className="w-full bg-transparent text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-11 rounded-xl border border-zinc-700/60 bg-[#101111] px-4 text-xs font-medium text-zinc-300 outline-none cursor-pointer focus:border-cyan-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="MENUNGGU">Menunggu Persetujuan</option>
              <option value="DIPINJAM">Sedang Dipinjam</option>
              <option value="DIKEMBALIKAN">Selesai / Dikembalikan</option>
              <option value="DIBATALKAN">Dibatalkan</option>
            </select>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto border-t border-zinc-800/80">
          <table className="w-full min-w-180 border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800/80 bg-[#181919]">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Kode
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Barang Dipinjam
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Tanggal Pinjam & Batas
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Status
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500">
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
                      <p className="text-sm text-zinc-400">
                        Memuat riwayat transaksi...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-zinc-500"
                  >
                    Belum ada catatan peminjaman.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-white/2"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold text-cyan-400">
                        {item.kodeTransaksi}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-zinc-200">
                          {item.barang.nama}
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs text-zinc-500">
                            SKU: {item.barang.sku}
                          </span>
                          {item.unit?.serialNumber ? (
                            <span className="inline-flex items-center gap-1 rounded bg-cyan-950/60 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-cyan-400 border border-cyan-800/40">
                              SN: {item.unit.serialNumber}
                            </span>
                          ) : (
                            <span className="text-xs text-zinc-500">
                              • {item.jumlah} unit
                            </span>
                          )}
                        </div>
                        {item.keperluan && (
                          <span className="mt-0.5 text-xs text-zinc-500 italic">
                            &quot;{item.keperluan}&quot;
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-xs">
                      <p className="text-zinc-400">
                        Pinjam: {formatDate(item.tanggalPinjam)}
                      </p>
                      <p className="font-medium text-amber-400/90">
                        Batas: {formatDate(item.tenggatWaktu)}
                      </p>
                      {item.tanggalKembali && (
                        <p className="text-emerald-400">
                          Kembali: {formatDate(item.tanggalKembali)}
                        </p>
                      )}
                    </td>

                    <td className="px-6 py-4">{renderStatusBadge(item.status)}</td>

                    <td className="px-6 py-4 text-center">
                      {(item.status === "MENUNGGU" || item.status === "DIPINJAM") ? (
                        <Button
                          size="sm"
                          onPress={() => setCancelTarget(item)}
                          className="h-8 rounded-lg border border-red-500/30 bg-red-500/10 px-3 text-xs font-semibold text-red-400 hover:bg-red-500/20"
                        >
                          Batalkan
                        </Button>
                      ) : (
                        <span className="text-xs text-zinc-600">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* DIALOG BATALKAN */}
      <ConfirmDialog
        isOpen={Boolean(cancelTarget)}
        title="Batalkan Peminjaman?"
        description={`Apakah Anda yakin ingin membatalkan pengajuan peminjaman barang "${cancelTarget?.barang.nama}" (${cancelTarget?.kodeTransaksi})?`}
        confirmLabel="Batalkan Peminjaman"
        isLoading={isCanceling}
        onConfirm={handleCancelPeminjaman}
        onCancel={() => setCancelTarget(null)}
      />
    </main>
  );
}
