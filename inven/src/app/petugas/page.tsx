"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Button, Card } from "@heroui/react";
import {
  ArrowRight,
  Box,
  CheckCircle2,
  Check,
  Clock3,
  ShieldCheck,
  X,
  Loader2,
  RotateCcw,
  Clock,
  Layers,
} from "lucide-react";
import { toast } from "@/src/lib/toast";

type TransaksiRequest = {
  id: string;
  kodeTransaksi: string;
  pengguna: { nama: string; email: string };
  barang: { nama: string; sku: string };
  unit?: { serialNumber: string } | null;
  tanggalPinjam: string;
  tenggatWaktu: string;
  keperluan?: string | null;
  status: string;
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function PetugasDashboardPage() {
  const [aktifPeminjaman, setAktifPeminjaman] = useState(0);
  const [menungguCount, setMenungguCount] = useState(0);
  const [selesaiCount, setSelesaiCount] = useState(0);
  const [totalTransaksi, setTotalTransaksi] = useState(0);

  const [pendingRequests, setPendingRequests] = useState<TransaksiRequest[]>([]);
  const [activeLoans, setActiveLoans] = useState<TransaksiRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const resTransaksi = await fetch("/api/transaksi");
      const dataTransaksi = await resTransaksi.json();

      if (Array.isArray(dataTransaksi.data)) {
        const txList: TransaksiRequest[] = dataTransaksi.data;
        setTotalTransaksi(txList.length);

        const aktif = txList.filter((t) => t.status === "DIPINJAM");
        setAktifPeminjaman(aktif.length);
        setActiveLoans(aktif.slice(0, 5));

        const pending = txList.filter((t) => t.status === "MENUNGGU");
        setMenungguCount(pending.length);
        setPendingRequests(pending);

        const selesai = txList.filter((t) => t.status === "DIKEMBALIKAN");
        setSelesaiCount(selesai.length);
      }
    } catch (err) {
      console.error("Dashboard Petugas error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboardData();
  }, [loadDashboardData]);

  const statData = useMemo(() => {
    return [
      {
        title: "Menunggu Persetujuan",
        value: menungguCount.toLocaleString("id-ID"),
        information: "Perlu Tindakan",
        icon: Clock3,
        tone: "amber" as const,
        highlight: menungguCount > 0,
      },
      {
        title: "Sedang Dipinjam",
        value: aktifPeminjaman.toLocaleString("id-ID"),
        information: "Peminjaman Aktif",
        icon: Box,
        tone: "cyan" as const,
        highlight: false,
      },
      {
        title: "Telah Dikembalikan",
        value: selesaiCount.toLocaleString("id-ID"),
        information: "Peminjaman Selesai",
        icon: CheckCircle2,
        tone: "emerald" as const,
        highlight: false,
      },
      {
        title: "Total Permohonan",
        value: totalTransaksi.toLocaleString("id-ID"),
        information: "Seluruh Riwayat",
        icon: Layers,
        tone: "neutral" as const,
        highlight: false,
      },
    ];
  }, [menungguCount, aktifPeminjaman, selesaiCount, totalTransaksi]);

  const handleDecision = async (
    id: string,
    decision: "DISETUJUI" | "DITOLAK" | "DIKEMBALIKAN"
  ) => {
    setProcessingId(id);
    try {
      let targetStatus = "DIPINJAM";
      let msg = "Peminjaman disetujui";
      if (decision === "DITOLAK") {
        targetStatus = "DITOLAK";
        msg = "Peminjaman ditolak";
      } else if (decision === "DIKEMBALIKAN") {
        targetStatus = "DIKEMBALIKAN";
        msg = "Barang berhasil dikembalikan, stok dipulihkan";
      }

      const res = await fetch(`/api/transaksi/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error("Gagal memproses permohonan", result.error);
        return;
      }

      toast.success("Berhasil", msg);
      loadDashboardData();
    } catch {
      toast.error("Terjadi kesalahan", "Tidak dapat terhubung ke server");
    } finally {
      setProcessingId(null);
    }
  };

  const TONE_STYLE = {
    amber: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    cyan: "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30",
    emerald: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    neutral: "bg-zinc-800 text-zinc-300 border border-zinc-700",
  };

  return (
    <div className="min-h-screen bg-[#101111] text-zinc-100">
      <main className="space-y-8 px-5 py-7 lg:px-8">
        {/* HEADER SECTION */}
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-cyan-400/10 p-1.5 text-cyan-400">
                <ShieldCheck size={20} />
              </span>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Beranda Petugas
              </h1>
            </div>
            <p className="mt-1 text-sm text-zinc-400">
              Pusat persetujuan peminjaman barang dan pengawasan pemulangan unit inventaris oleh pengguna.
            </p>
          </div>

          <Link href="/petugas/transaksi">
            <Button className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-semibold text-[#08181a] hover:bg-cyan-400">
              <span>Buka Kelola Transaksi</span>
              <ArrowRight size={14} />
            </Button>
          </Link>
        </section>

        {/* STATISTIK CARDS */}
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statData.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.title}
                className={`rounded-2xl border p-5 shadow-none transition-all duration-200 hover:-translate-y-0.5 ${
                  item.highlight
                    ? "border-amber-500/40 bg-amber-950/10"
                    : "border-zinc-800 bg-[#181919] hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      TONE_STYLE[item.tone]
                    }`}
                  >
                    <Icon size={20} strokeWidth={2.2} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-zinc-400">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-2xl font-bold tracking-tight text-white">
                      {item.value}
                    </p>
                    <p className="text-[11px] text-zinc-500">{item.information}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </section>

        {/* PERMOHONAN MENUNGGU PERSETUJUAN */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <Clock className="text-amber-400" size={18} />
                Permohonan Menunggu Persetujuan
                {pendingRequests.length > 0 && (
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/30">
                    {pendingRequests.length} Baru
                  </span>
                )}
              </h2>
              <p className="mt-0.5 text-xs text-zinc-400">
                Permohonan peminjaman barang dari user yang memerlukan keputusan persetujuan dari petugas.
              </p>
            </div>

            <Link
              href="/petugas/transaksi"
              className="group flex items-center gap-1 text-xs font-semibold text-cyan-400 transition hover:text-cyan-300"
            >
              <span>Lihat Semua</span>
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </div>

          <Card className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#181919] shadow-none">
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="animate-spin text-cyan-400" size={24} />
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-500">
                  <CheckCircle2 size={24} />
                </div>
                <p className="mt-3 text-sm font-semibold text-zinc-300">
                  Semua Beres!
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Tidak ada permohonan peminjaman yang menunggu persetujuan saat ini.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-160 text-left text-sm">
                  <thead className="border-b border-zinc-800 bg-[#151616] text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    <tr>
                      <th className="px-6 py-3.5">Kode / Peminjam</th>
                      <th className="px-6 py-3.5">Barang</th>
                      <th className="px-6 py-3.5">Serial Number</th>
                      <th className="px-6 py-3.5">Jadwal Pinjam</th>
                      <th className="px-6 py-3.5 text-center">Tindakan Petugas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {pendingRequests.map((req) => (
                      <tr
                        key={req.id}
                        className="transition-colors hover:bg-white/[0.02]"
                      >
                        <td className="px-6 py-4">
                          <p className="font-mono text-xs font-bold text-cyan-400">
                            {req.kodeTransaksi}
                          </p>
                          <p className="mt-0.5 text-sm font-semibold text-zinc-200">
                            {req.pengguna.nama}
                          </p>
                          <p className="text-[11px] text-zinc-500">
                            {req.pengguna.email}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-zinc-200">
                            {req.barang.nama}
                          </p>
                          {req.keperluan && (
                            <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500 italic">
                              &quot;{req.keperluan}&quot;
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {req.unit?.serialNumber ? (
                            <span className="inline-flex items-center gap-1 rounded border border-cyan-800/40 bg-cyan-950/60 px-2 py-0.5 font-mono text-xs font-semibold text-cyan-400">
                              SN: {req.unit.serialNumber}
                            </span>
                          ) : (
                            <span className="text-xs text-zinc-500">
                              1 Unit Fisik
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs">
                          <p className="text-zinc-400">
                            Mulai: {formatDate(req.tanggalPinjam)}
                          </p>
                          <p className="font-semibold text-amber-400/90">
                            Batas: {formatDate(req.tenggatWaktu)}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              className="flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/25"
                              isDisabled={processingId === req.id}
                              onPress={() => handleDecision(req.id, "DISETUJUI")}
                            >
                              <Check size={14} />
                              Setujui
                            </Button>
                            <Button
                              size="sm"
                              className="flex items-center gap-1.5 rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/25"
                              isDisabled={processingId === req.id}
                              onPress={() => handleDecision(req.id, "DITOLAK")}
                            >
                              <X size={14} />
                              Tolak
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </section>

        {/* PEMINJAMAN BERJALAN (SEDANG DIPINJAM) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <Box className="text-cyan-400" size={18} />
                Peminjaman Aktif (Sedang Berjalan)
              </h2>
              <p className="mt-0.5 text-xs text-zinc-400">
                Daftar unit barang yang sedang dipinjam oleh user dan belum dikembalikan.
              </p>
            </div>

            <Link
              href="/petugas/transaksi"
              className="group flex items-center gap-1 text-xs font-semibold text-cyan-400 transition hover:text-cyan-300"
            >
              <span>Kelola Seluruh Peminjaman</span>
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </div>

          <Card className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#181919] shadow-none">
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="animate-spin text-cyan-400" size={24} />
              </div>
            ) : activeLoans.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <p className="text-sm font-medium text-zinc-400">
                  Tidak ada barang yang sedang dipinjam saat ini.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-160 text-left text-sm">
                  <thead className="border-b border-zinc-800 bg-[#151616] text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    <tr>
                      <th className="px-6 py-3.5">Kode Transaksi</th>
                      <th className="px-6 py-3.5">Peminjam</th>
                      <th className="px-6 py-3.5">Barang & SN</th>
                      <th className="px-6 py-3.5">Batas Pengembalian</th>
                      <th className="px-6 py-3.5 text-center">Aksi Pengembalian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {activeLoans.map((loan) => (
                      <tr
                        key={loan.id}
                        className="transition-colors hover:bg-white/[0.02]"
                      >
                        <td className="px-6 py-4 font-mono text-xs font-bold text-cyan-400">
                          {loan.kodeTransaksi}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-zinc-200">
                            {loan.pengguna.nama}
                          </p>
                          <p className="text-[11px] text-zinc-500">
                            {loan.pengguna.email}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-zinc-200">
                            {loan.barang.nama}
                          </p>
                          {loan.unit?.serialNumber && (
                            <span className="inline-flex items-center rounded bg-cyan-950/60 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-cyan-400 border border-cyan-800/40">
                              SN: {loan.unit.serialNumber}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs">
                          <span className="font-semibold text-amber-400">
                            {formatDate(loan.tenggatWaktu)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Button
                            size="sm"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/15 px-3 py-1.5 text-xs font-semibold text-cyan-400 hover:bg-cyan-500/25"
                            isDisabled={processingId === loan.id}
                            onPress={() =>
                              handleDecision(loan.id, "DIKEMBALIKAN")
                            }
                          >
                            <RotateCcw size={14} />
                            Kembalikan
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </section>
      </main>
    </div>
  );
}
