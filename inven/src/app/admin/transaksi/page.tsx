"use client";

import Link from "next/link";
import { Card, Button } from "@heroui/react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Pencil,
  Trash2,
  RotateCcw,
  Check,
  X,
  Loader2,
  Package,
} from "lucide-react";
import { useMemo, useState, useEffect, useCallback } from "react";
import { ConfirmDialog } from "@/src/components/kelola_barang/ConfirmDialog";
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

export default function KelolaTransaksiPage() {
  const [data, setData] = useState<TransaksiItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // State untuk dialog hapus
  const [deleteTarget, setDeleteTarget] = useState<TransaksiItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // State untuk aksi status (setujui, tolak, kembalikan)
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

  // Aksi Update Status
  const handleUpdateStatus = async (
    id: string,
    newStatus: TransaksiItem["status"],
    successMsg: string,
  ) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/transaksi/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const result = await res.json();

      if (!res.ok) {
        toast.error("Gagal memperbarui status", result.error || "Terjadi kesalahan");
        return;
      }

      toast.success("Berhasil", successMsg);
      setData((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)),
      );
    } catch {
      toast.error("Terjadi kesalahan", "Tidak dapat terhubung ke server");
    } finally {
      setUpdatingId(null);
    }
  };

  // Aksi Hapus Transaksi
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/transaksi/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const result = await res.json();

      if (!res.ok) {
        toast.error("Gagal menghapus transaksi", result.error);
        setIsDeleting(false);
        return;
      }

      toast.success("Transaksi dihapus", "Catatan transaksi berhasil dihapus");
      setData((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      toast.error("Terjadi kesalahan", "Tidak dapat terhubung ke server");
    } finally {
      setIsDeleting(false);
    }
  };

  // Ringkasan Statistik
  const ringkasan = useMemo(() => {
    const total = data.length;
    const menunggu = data.filter((t) => t.status === "MENUNGGU").length;
    const dipinjam = data.filter((t) => t.status === "DIPINJAM").length;
    const terlambat = data.filter((t) => t.status === "TERLAMBAT").length;
    const dikembalikan = data.filter((t) => t.status === "DIKEMBALIKAN").length;
    return { total, menunggu, dipinjam, terlambat, dikembalikan };
  }, [data]);

  // Filter Data
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchQuery =
        item.kodeTransaksi.toLowerCase().includes(query.toLowerCase()) ||
        item.pengguna.nama.toLowerCase().includes(query.toLowerCase()) ||
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
            Menunggu
          </span>
        );
      case "DIPINJAM":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-900/50 bg-cyan-950/30 px-2.5 py-1 text-xs font-medium text-cyan-400">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Dipinjam
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
            Dikembalikan
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
      {/* HEADER SECTION */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Kelola Transaksi Peminjaman
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Pantau dan setujui peminjaman serta pengembalian inventaris sekolah.
          </p>
        </div>

        <Link href="/admin/transaksi/hal_catatbarang">
          <button
            type="button"
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 text-sm font-bold tracking-wide text-[#08181a] transition hover:bg-cyan-300"
          >
            <Plus size={18} strokeWidth={2.5} />
            Catat Peminjaman
          </button>
        </Link>
      </section>

      {/* STAT CARDS */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
              <Package size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">Dipinjam</p>
              <p className="text-xl font-bold text-white">{ringkasan.dipinjam}</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border border-zinc-800 bg-[#181919] p-4 shadow-none">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">Terlambat</p>
              <p className="text-xl font-bold text-white">{ringkasan.terlambat}</p>
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
              <p className="text-xl font-bold text-white">{ringkasan.dikembalikan}</p>
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
              placeholder="Cari kode, peminjam, barang, atau serial number..."
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
              <option value="DIPINJAM">Dipinjam (Aktif)</option>
              <option value="TERLAMBAT">Terlambat</option>
              <option value="DIKEMBALIKAN">Dikembalikan</option>
              <option value="DITOLAK">Ditolak / Batal</option>
            </select>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto border-t border-zinc-800/80">
          <table className="w-full min-w-220 border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800/80 bg-[#181919]">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Kode Transaksi
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Peminjam
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Barang (Jumlah)
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Tgl Pinjam & Batas
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
                  <td colSpan={6} className="px-6 py-16 text-center">
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
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-zinc-500"
                  >
                    Tidak ada transaksi yang cocok.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-white/2"
                  >
                    {/* KODE */}
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold text-cyan-400">
                        {item.kodeTransaksi}
                      </span>
                      {item.keperluan && (
                        <p className="mt-1 line-clamp-1 text-xs text-zinc-500">
                          {item.keperluan}
                        </p>
                      )}
                    </td>

                    {/* PEMINJAM */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-300 border border-zinc-700">
                          {getInitials(item.pengguna.nama)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-zinc-200">
                            {item.pengguna.nama}
                          </span>
                          <span className="text-[11px] text-zinc-500">
                            {item.pengguna.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* BARANG */}
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
                      </div>
                    </td>

                    {/* TANGGAL */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-xs">
                        <span className="text-zinc-400">
                          Pinjam: {formatDate(item.tanggalPinjam)}
                        </span>
                        <span className="font-medium text-amber-400/90">
                          Batas: {formatDate(item.tenggatWaktu)}
                        </span>
                      </div>
                    </td>

                    {/* STATUS */}
                    <td className="px-6 py-4">{renderStatusBadge(item.status)}</td>

                    {/* AKSI */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Jika MENUNGGU -> tombol Setujui & Tolak */}
                        {item.status === "MENUNGGU" && (
                          <>
                            <Button
                              size="sm"
                              isIconOnly
                              onPress={() =>
                                handleUpdateStatus(
                                  item.id,
                                  "DIPINJAM",
                                  "Peminjaman disetujui, stok barang dikurangi",
                                )
                              }
                              isDisabled={updatingId === item.id}
                              className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                              aria-label="Setujui Peminjaman"
                            >
                              <Check size={16} />
                            </Button>
                            <Button
                              size="sm"
                              isIconOnly
                              onPress={() =>
                                handleUpdateStatus(
                                  item.id,
                                  "DITOLAK",
                                  "Peminjaman ditolak",
                                )
                              }
                              isDisabled={updatingId === item.id}
                              className="h-8 w-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                              aria-label="Tolak Peminjaman"
                            >
                              <X size={16} />
                            </Button>
                          </>
                        )}

                        {/* Jika DIPINJAM atau TERLAMBAT -> tombol Kembalikan */}
                        {(item.status === "DIPINJAM" || item.status === "TERLAMBAT") && (
                          <Button
                            size="sm"
                            onPress={() =>
                              handleUpdateStatus(
                                item.id,
                                "DIKEMBALIKAN",
                                "Barang berhasil dikembalikan, stok dipulihkan",
                              )
                            }
                            isDisabled={updatingId === item.id}
                            className="flex h-8 items-center gap-1.5 rounded-lg bg-cyan-500/15 px-2.5 text-xs font-semibold text-cyan-400 hover:bg-cyan-500/25"
                          >
                            <RotateCcw size={14} />
                            Kembalikan
                          </Button>
                        )}

                        {/* Tombol Edit */}
                        <Link
                          href={`/admin/transaksi/hal_catatbarang?id=${item.id}`}
                          aria-label="Edit Transaksi"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-800 hover:text-cyan-400"
                        >
                          <Pencil size={15} />
                        </Link>

                        {/* Tombol Hapus */}
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(item)}
                          aria-label="Hapus Transaksi"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-red-500/10 hover:text-red-400"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* DIALOG KONFIRMASI HAPUS */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Hapus Catatan Transaksi"
        description={`Apakah Anda yakin ingin menghapus catatan transaksi ${deleteTarget?.kodeTransaksi}? Jika barang masih berstatus dipinjam, stok barang akan otomatis dikembalikan.`}
        confirmLabel="Hapus Transaksi"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </main>
  );
}
