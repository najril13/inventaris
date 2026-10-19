"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Card } from "@heroui/react";
import {
  Archive,
  ArrowRight,
  Box,
  CheckCircle2,
  Package,
} from "lucide-react";

type BarangItem = {
  id: string;
  nama: string;
  kategori?: { nama: string };
  status: string;
  stok: number;
  createdAt: string;
};

type TransaksiItem = {
  id: string;
  status: string;
};

export default function UserPage() {
  const [totalBarang, setTotalBarang] = useState(0);
  const [totalKategori, setTotalKategori] = useState(0);
  const [barangTersedia, setBarangTersedia] = useState(0);
  const [pinjamanAktif, setPinjamanAktif] = useState(0);
  const [recentBarang, setRecentBarang] = useState<BarangItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
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
        setRecentBarang(dataBarang.data.slice(0, 5));
      }

      if (Array.isArray(dataKategori.data)) {
        setTotalKategori(dataKategori.data.length);
      }

      if (Array.isArray(dataTransaksi.data)) {
        const aktif = dataTransaksi.data.filter(
          (t: TransaksiItem) => t.status === "DIPINJAM",
        ).length;
        setPinjamanAktif(aktif);
      }
    } catch (err) {
      console.error("User dashboard error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const statData = useMemo(() => {
    return [
      {
        title: "Total Barang",
        value: totalBarang.toLocaleString("id-ID"),
        information: "Katalog Sekolah",
        icon: Package,
        active: false,
      },
      {
        title: "Total Kategori",
        value: totalKategori.toLocaleString("id-ID"),
        information: "Kategori Barang",
        icon: Archive,
        active: false,
      },
      {
        title: "Siap Dipinjam",
        value: barangTersedia.toLocaleString("id-ID"),
        information: "Stok Tersedia",
        icon: CheckCircle2,
        active: false,
      },
      {
        title: "Pinjaman Aktif Saya",
        value: pinjamanAktif.toLocaleString("id-ID"),
        information: "Sedang Dipinjam",
        icon: Box,
        active: true,
      },
    ];
  }, [totalBarang, totalKategori, barangTersedia, pinjamanAktif]);

  return (
    <div className="min-h-screen bg-[#101111] text-zinc-100">
      <header className="flex min-h-17 items-center justify-between gap-5 border-b border-zinc-800 px-5 lg:px-8">
        <div>
          <h1 className="whitespace-nowrap text-xl font-bold tracking-tight text-zinc-100 lg:text-2xl">
            Dashboard Pengguna
          </h1>
          <p className="text-xs text-zinc-500">
            Selamat datang di Sistem Inventaris Sekolah
          </p>
        </div>
        <Link
          href="/user/barang"
          className="flex h-10 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 text-xs font-bold text-[#08181a] transition hover:bg-cyan-400"
        >
          <Package size={15} />
          Pinjam Barang
        </Link>
      </header>

      {/* KONTEN UTAMA */}
      <main className="space-y-8 px-5 py-7 lg:px-8">
        {/* STATS */}
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

        {/* INVENTARIS TERBARU */}
        <section>
          <Card className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#181919] shadow-none">
            <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-zinc-100">
                  Katalog Barang Terbaru
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Daftar barang inventaris yang dapat dipinjam
                </p>
              </div>

              <Link
                href="/user/barang"
                className="flex shrink-0 items-center gap-2 text-sm font-semibold text-cyan-400 transition hover:text-cyan-300"
              >
                Katalog Lengkap
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
                      Kategori
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Aksi
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
                    recentBarang.map((item) => {
                      const isAvailable = item.stok > 0 && item.status !== "HABIS";
                      return (
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
                                isAvailable
                                  ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-400"
                                  : "border-red-500/30 bg-red-500/10 text-red-400"
                              }`}
                            >
                              {isAvailable ? `Tersedia (${item.stok})` : "Habis"}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <Link
                              href="/user/barang"
                              className="text-xs font-semibold text-cyan-400 hover:underline"
                            >
                              Pinjam Sekarang &rarr;
                            </Link>
                          </td>
                        </tr>
                      );
                    })
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
