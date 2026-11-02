"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Button, Card } from "@heroui/react";
import {
  Archive,
  ArrowRight,
  Box,
  CheckCircle2,
  Check,
  Clock3,
  Package,
  ShieldCheck,
  X,
  Loader2,
  PackageX,
  AlertTriangle,
} from "lucide-react";
import { toast } from "@/src/lib/toast";

type BarangItem = {
  id: string;
  nama: string;
  kategori?: { nama: string };
  status: string;
  stok: number;
  createdAt: string;
};

type TransaksiRequest = {
  id: string;
  kodeTransaksi: string;
  pengguna: { nama: string; email: string };
  barang: { nama: string };
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
  const [totalBarang, setTotalBarang] = useState(0);
  const [totalKategori, setTotalKategori] = useState(0);
  const [aktifPeminjaman, setAktifPeminjaman] = useState(0);
  const [menungguCount, setMenungguCount] = useState(0);
  const [barangTersedia, setBarangTersedia] = useState(0);
  const [barangHabis, setBarangHabis] = useState(0);

  const [recentBarang, setRecentBarang] = useState<BarangItem[]>([]);
  const [pendingRequests, setPendingRequests] = useState<TransaksiRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [resBarang, resKategori, resTransaksi] = await Promise.all([
        fetch("/api/barang"),
        fetch("/api/jenisbarang"),
        fetch("/api/transaksi"),
      ]);

      const dataBarang = await resBarang.json();
      const dataKategori = await resKategori.json();
      const dataTransaksi = await resTransaksi.json();

      if (Array.isArray(dataBarang.data)) {
        setTotalBarang(dataBarang.data.length);
        const tersedia = dataBarang.data.filter(
          (b: BarangItem) => b.stok > 0 && b.status !== "HABIS",
        ).length;
        setBarangTersedia(tersedia);
        setBarangHabis(dataBarang.data.length - tersedia);
        setRecentBarang(dataBarang.data.slice(0, 5));
      }

      if (Array.isArray(dataKategori.data)) {
        setTotalKategori(dataKategori.data.length);
      }

      if (Array.isArray(dataTransaksi.data)) {
        const aktif = dataTransaksi.data.filter(
          (t: { status: string }) => t.status === "DIPINJAM",
        ).length;
        setAktifPeminjaman(aktif);

        const pending = dataTransaksi.data.filter(
          (t: { status: string }) => t.status === "MENUNGGU",
        );
        setMenungguCount(pending.length);
        setPendingRequests(pending);
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
        title: "Total Barang",
        value: totalBarang.toLocaleString("id-ID"),
        information: "Katalog Inventaris",
        icon: Package,
        active: false,
      },
      {
        title: "Total Kategori",
        value: totalKategori.toLocaleString("id-ID"),
        information: "Jenis Barang",
        icon: Archive,
        active: false,
      },
      {
        title: "Menunggu Persetujuan",
        value: menungguCount.toLocaleString("id-ID"),
        information: "Perlu Tindakan",
        icon: Clock3,
        active: menungguCount > 0,
        highlight: true,
      },
      {
        title: "Aktif Peminjaman",
        value: aktifPeminjaman.toLocaleString("id-ID"),
        information: "Sedang Dipinjam",
        icon: Box,
        active: true,
      },
    ];
  }, [totalBarang, totalKategori, menungguCount, aktifPeminjaman]);

  const handleDecision = async (
    id: string,
    decision: "DISETUJUI" | "DITOLAK",
  ) => {
    const target = pendingRequests.find((r) => r.id === id);
    if (!target) return;

    setProcessingId(id);
    try {
      const targetStatus = decision === "DISETUJUI" ? "DIPINJAM" : "DITOLAK";
      const res = await fetch(`/api/transaksi/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error("Gagal memproses", result.error || "Terjadi kesalahan");
        return;
      }

      if (decision === "DISETUJUI") {
        toast.success(
          "Peminjaman disetujui",
          `${target.pengguna.nama} dapat mengambil ${target.barang.nama}`,
        );
      } else {
        toast.error(
          "Peminjaman ditolak",
          `Permintaan ${target.pengguna.nama} untuk ${target.barang.nama} ditolak`,
        );
      }

      setPendingRequests((prev) => prev.filter((r) => r.id !== id));
      loadDashboardData();
    } catch {
      toast.error("Terjadi kesalahan", "Tidak dapat terhubung ke server");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#101111] text-zinc-100">
      <header className="flex min-h-17 items-center justify-between gap-5 border-b border-zinc-800 px-5 lg:px-8">
        <div className="flex items-center gap-3">
          <h1 className="whitespace-nowrap text-xl font-bold tracking-tight text-zinc-100 lg:text-2xl">
            Dashboard Petugas
          </h1>
          <span className="flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400">
            <ShieldCheck size={14} />
            Petugas Inventaris
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/petugas/transaksi/hal_catatbarang">
            <Button
              size="sm"
              className="bg-cyan-400 text-xs font-bold text-[#08181a] hover:bg-cyan-300"
            >
              Catat Peminjaman
            </Button>
          </Link>
          <Link href="/petugas/barang/hal_barang">
            <Button
              size="sm"
              variant="tertiary"
              className="border border-zinc-700 bg-zinc-800/60 text-xs font-medium text-zinc-200 hover:bg-zinc-700"
            >
              Tambah Barang
            </Button>
          </Link>
        </div>
      </header>

      <main className="space-y-8 px-5 py-7 lg:px-8">
        {/* STATS UTAMA */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statData.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.title}
                className={`rounded-2xl border p-5 shadow-none transition duration-200 hover:-translate-y-0.5 ${
                  item.highlight
                    ? "border-amber-500/40 bg-[#1c1917]"
                    : "border-zinc-800 bg-[#181919]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      {item.title}
                    </p>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-100">
                      {isLoading ? "-" : item.value}
                    </p>
                  </div>
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                      item.highlight
                        ? "bg-amber-500/15 text-amber-400"
                        : item.active
                          ? "bg-cyan-500/15 text-cyan-400"
                          : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    <Icon size={24} />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-zinc-800/80 pt-3">
                  <span className="text-xs text-zinc-500">{item.information}</span>
                  {item.highlight && menungguCount > 0 && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400">
                      <AlertTriangle size={12} />
                      Menunggu respon
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </section>

        {/* PERSETUJUAN PEMINJAMAN (QUICK ACTION) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-zinc-100">
                  Permohonan Peminjaman Menunggu Persetujuan
                </h2>
                {pendingRequests.length > 0 && (
                  <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/30">
                    {pendingRequests.length} Baru
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-zinc-500">
                Setujui atau tolak pengajuan peminjaman barang dari siswa / guru sebelum barang dapat diambil.
              </p>
            </div>

            <Link
              href="/petugas/transaksi"
              className="group flex items-center gap-1 text-xs font-semibold text-cyan-400 transition hover:text-cyan-300"
            >
              <span>Lihat Semua Transaksi</span>
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
                      <th className="px-6 py-3.5 text-center">Tindakan</th>
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
                            <span className="inline-flex items-center gap-1 rounded bg-cyan-950/60 px-2 py-0.5 font-mono text-xs font-semibold text-cyan-400 border border-cyan-800/40">
                              SN: {req.unit.serialNumber}
                            </span>
                          ) : (
                            <span className="text-xs text-zinc-500">Otomatis saat disetujui</span>
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

        {/* STATUS STOK & BARANG TERBARU */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* KETERSEDIAAN STOK */}
          <Card className="rounded-2xl border border-zinc-800 bg-[#181919] p-6 shadow-none">
            <h2 className="text-base font-bold tracking-tight text-zinc-100">
              Kondisi Stok Inventaris
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Status ketersediaan katalog barang sekolah.
            </p>

            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-[#121313] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-zinc-400">
                      Tersedia Dipinjam
                    </p>
                    <p className="text-lg font-bold text-zinc-100">
                      {barangTersedia} Tipe Barang
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-[#121313] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                    <PackageX size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-zinc-400">
                      Stok Habis / Sedang Dipinjam
                    </p>
                    <p className="text-lg font-bold text-zinc-100">
                      {barangHabis} Tipe Barang
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <Link href="/petugas/barang" className="w-full">
                <Button className="w-full rounded-xl bg-zinc-800 text-xs font-semibold text-zinc-200 hover:bg-zinc-700">
                  Lihat Seluruh Barang
                </Button>
              </Link>
            </div>
          </Card>

          {/* BARANG TERBARU */}
          <Card className="col-span-1 rounded-2xl border border-zinc-800 bg-[#181919] p-6 shadow-none lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold tracking-tight text-zinc-100">
                  Inventaris Barang Terbaru
                </h2>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Daftar 5 barang yang baru ditambahkan ke sistem.
                </p>
              </div>

              <Link
                href="/petugas/barang"
                className="group flex items-center gap-1 text-xs font-semibold text-cyan-400 transition hover:text-cyan-300"
              >
                <span>Katalog Lengkap</span>
                <ArrowRight
                  size={14}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </div>

            <div className="mt-5 overflow-hidden rounded-xl border border-zinc-800/80">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#121313] text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    <tr>
                      <th className="px-5 py-3">Nama Barang</th>
                      <th className="px-5 py-3">Kategori</th>
                      <th className="px-5 py-3">Ketersediaan</th>
                      <th className="px-5 py-3">Tanggal Input</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 bg-[#181919]">
                    {recentBarang.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-5 py-8 text-center text-xs text-zinc-500"
                        >
                          Belum ada data barang.
                        </td>
                      </tr>
                    ) : (
                      recentBarang.map((item) => (
                        <tr
                          key={item.id}
                          className="transition-colors hover:bg-white/[0.02]"
                        >
                          <td className="px-5 py-3.5 font-medium text-zinc-200">
                            {item.nama}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-zinc-400">
                            {item.kategori?.nama || "-"}
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                item.stok > 0
                                  ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                                  : "border border-red-500/30 bg-red-500/10 text-red-400"
                              }`}
                            >
                              {item.stok > 0 ? `${item.stok} Unit` : "Habis"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-zinc-500">
                            {formatDate(item.createdAt)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
