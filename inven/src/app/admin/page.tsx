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
  Users,
  X,
  Loader2,
  PackageX,
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
  tanggalPinjam: string;
  tenggatWaktu: string;
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

export default function AdminPage() {
  const [totalBarang, setTotalBarang] = useState(0);
  const [totalKategori, setTotalKategori] = useState(0);
  const [totalUser, setTotalUser] = useState(0);
  const [aktifPeminjaman, setAktifPeminjaman] = useState(0);
  const [barangTersedia, setBarangTersedia] = useState(0);
  const [barangHabis, setBarangHabis] = useState(0);

  const [recentBarang, setRecentBarang] = useState<BarangItem[]>([]);
  const [pendingRequests, setPendingRequests] = useState<TransaksiRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [resBarang, resKategori, resUser, resTransaksi] = await Promise.all([
        fetch("/api/barang"),
        fetch("/api/jenisbarang"),
        fetch("/api/pengguna"),
        fetch("/api/transaksi"),
      ]);

      const dataBarang = await resBarang.json();
      const dataKategori = await resKategori.json();
      const dataUser = await resUser.json();
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

      if (Array.isArray(dataUser.data)) {
        setTotalUser(dataUser.data.length);
      }

      if (Array.isArray(dataTransaksi.data)) {
        const aktif = dataTransaksi.data.filter(
          (t: { status: string }) => t.status === "DIPINJAM",
        ).length;
        setAktifPeminjaman(aktif);

        const pending = dataTransaksi.data.filter(
          (t: { status: string }) => t.status === "MENUNGGU",
        );
        setPendingRequests(pending);
      }
    } catch (err) {
      console.error("Dashboard error:", err);
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
        information: "Inventaris Aktif",
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
        title: "Total Pengguna",
        value: totalUser.toLocaleString("id-ID"),
        information: "Akun Terdaftar",
        icon: Users,
        active: false,
      },
      {
        title: "Aktif Peminjaman",
        value: aktifPeminjaman.toLocaleString("id-ID"),
        information: "Sedang Dipinjam",
        icon: Box,
        active: true,
      },
    ];
  }, [totalBarang, totalKategori, totalUser, aktifPeminjaman]);

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
            Dashboard Overview
          </h1>
          <span className="flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400">
            <ShieldCheck size={14} />
            Admin
          </span>
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
                className="rounded-2xl border border-zinc-800 bg-[#181919] p-5 shadow-none transition duration-200 hover:-translate-y-0.5 hover:border-zinc-700"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800/80 text-cyan-400">
                    <Icon size={24} />
                  </div>
                  {item.active && (
                    <span className="mt-2 h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
                  )}
                </div>

                <div className="mt-5">
                  <p className="text-sm font-semibold tracking-wide text-zinc-400">
                    {item.title}
                  </p>
                  <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-100">
                    {isLoading ? "..." : item.value}
                  </h2>
                  <p className="mt-1 text-xs text-zinc-500">{item.information}</p>
                </div>
              </Card>
            );
          })}
        </section>

        {/* STATS KETERSEDIAAN */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-[#181919] p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <p className="text-sm text-zinc-500">Barang Siap Dipinjam</p>
              <p className="mt-1 text-xl font-bold text-zinc-100">
                {isLoading ? "..." : barangTersedia}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-[#181919] p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <Clock3 size={22} />
            </div>
            <div>
              <p className="text-sm text-zinc-500">Sedang Dipinjam</p>
              <p className="mt-1 text-xl font-bold text-zinc-100">
                {isLoading ? "..." : aktifPeminjaman}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-[#181919] p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
              <PackageX size={22} />
            </div>
            <div>
              <p className="text-sm text-zinc-500">Stok Habis</p>
              <p className="mt-1 text-xl font-bold text-zinc-100">
                {isLoading ? "..." : barangHabis}
              </p>
            </div>
          </div>
        </section>

        {/* PERMINTAAN PEMINJAMAN MENUNGGU PERSETUJUAN */}
        <section>
          <Card className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#181919] shadow-none">
            <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-zinc-100">
                  Permintaan Peminjaman
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  {pendingRequests.length > 0
                    ? `${pendingRequests.length} permintaan menunggu persetujuan`
                    : "Tidak ada permintaan yang menunggu"}
                </p>
              </div>
              <Link
                href="/admin/transaksi"
                className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
              >
                Lihat Semua Transaksi
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="divide-y divide-zinc-800/70">
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="animate-spin text-cyan-400" size={24} />
                </div>
              ) : pendingRequests.length === 0 ? (
                <div className="p-8 text-center text-sm text-zinc-500">
                  Tidak ada permintaan peminjaman baru saat ini.
                </div>
              ) : (
                pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/80">
                        <Package size={20} className="text-cyan-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-zinc-200">
                          {req.barang.nama}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-500">
                          {req.pengguna.nama} &middot; Pinjam:{" "}
                          {formatDate(req.tanggalPinjam)} &middot; Batas:{" "}
                          {formatDate(req.tenggatWaktu)}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <Button
                        size="sm"
                        onPress={() => handleDecision(req.id, "DITOLAK")}
                        isDisabled={processingId === req.id}
                        className="flex h-9 items-center gap-1.5 rounded-lg border border-zinc-700 bg-transparent px-3 text-xs font-semibold text-zinc-300 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-60"
                      >
                        <X size={14} />
                        Tolak
                      </Button>
                      <Button
                        size="sm"
                        onPress={() => handleDecision(req.id, "DISETUJUI")}
                        isDisabled={processingId === req.id}
                        className="flex h-9 items-center gap-1.5 rounded-lg bg-cyan-500 px-3 text-xs font-semibold text-[#08181a] transition hover:bg-cyan-400 disabled:opacity-60"
                      >
                        <Check size={14} />
                        Setujui
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </section>

        {/* INVENTARIS TERBARU */}
        <section>
          <Card className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#181919] shadow-none">
            <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-zinc-100">
                  Inventaris Terbaru
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Data barang dalam sistem
                </p>
              </div>

              <Link
                href="/admin/barang"
                className="flex shrink-0 items-center gap-2 text-sm font-semibold text-cyan-400 transition hover:text-cyan-300"
              >
                Lihat Semua
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-160 border-collapse text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Nama Barang
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Jenis
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Tanggal Input
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {recentBarang.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">
                        Belum ada barang di inventaris.
                      </td>
                    </tr>
                  ) : (
                    recentBarang.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-zinc-800/70 transition-colors last:border-b-0 hover:bg-white/2"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/80">
                              <Package size={18} className="text-cyan-400" />
                            </div>
                            <span className="font-medium text-zinc-200">
                              {item.nama}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-4 align-middle text-zinc-400">
                          {item.kategori?.nama || "Umum"}
                        </td>

                        <td className="px-4 py-4 align-middle">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
                              item.stok > 0 && item.status !== "HABIS"
                                ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
                                : "border-red-500/30 bg-red-500/10 text-red-400"
                            }`}
                          >
                            {item.stok > 0 && item.status !== "HABIS"
                              ? `Tersedia (${item.stok})`
                              : "Habis"}
                          </span>
                        </td>

                        <td className="px-6 py-4 align-middle text-zinc-500">
                          {formatDate(item.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}
