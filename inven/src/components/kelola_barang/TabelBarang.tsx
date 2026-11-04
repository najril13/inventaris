"use client";

import Link from "next/link";
import { Card } from "@heroui/react";
import {
  ChevronLeft,
  ChevronRight,
  Package,
  Pencil,
  Trash2,
} from "lucide-react";

export type ItemStatus = "TERSEDIA" | "DIPINJAM" | "HABIS" | "MENUNGGU" | "RUSAK";

export type KategoriBarang = {
  id: string;
  nama: string;
};

export type InventoryItem = {
  id: string;
  nama: string;
  kategori: KategoriBarang | string;
  sku: string;
  stok: number;
  totalUnit?: number;
  tersediaCount?: number;
  dipinjamCount?: number;
  rusakCount?: number;
  status: ItemStatus;
};

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
  TERSEDIA: {
    label: "Tersedia",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  },
  DIPINJAM: {
    label: "Sedang Dipinjam",
    className: "border-red-500/30 bg-red-500/10 text-red-400",
  },
  MENUNGGU: {
    label: "Menunggu Persetujuan",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  },
  HABIS: {
    label: "Tidak Tersedia",
    className: "border-zinc-600/60 bg-zinc-700/40 text-zinc-300",
  },
  RUSAK: {
    label: "Rusak",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  },
};

type Props = {
  data: InventoryItem[];
  isLoading: boolean;
  error: string | null;
  deletingId: string | null;
  onDelete: (id: string, nama: string) => void;
  editBasePath?: string;
};

export function BarangTable({
  data,
  isLoading,
  error,
  deletingId,
  onDelete,
  editBasePath = "/admin/barang",
}: Props) {
  const totalItems = data.length;

  const getKategoriNama = (kategori: KategoriBarang | string) => {
    if (typeof kategori === "object" && kategori !== null) {
      return kategori.nama;
    }
    return kategori;
  };

  return (
    <Card className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#181919] shadow-none">
      <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-5">
        <div>
          <h3 className="text-base font-semibold text-zinc-100">
            Daftar Barang & Ketersediaan Unit
          </h3>
          <p className="mt-0.5 text-xs text-zinc-500">
            Menampilkan {totalItems} tipe barang
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-180 border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-white/1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              <th className="w-16 px-6 py-4 align-middle text-center">
                Gambar
              </th>
              <th className="px-5 py-4 align-middle text-left">
                Nama Barang
              </th>
              <th className="px-5 py-4 align-middle text-left">
                Kategori
              </th>
              <th className="px-5 py-4 align-middle text-left">
                SKU
              </th>
              <th className="px-5 py-4 align-middle text-center">
                Ketersediaan Unit
              </th>
              <th className="px-5 py-4 align-middle text-center">
                Status
              </th>
              <th className="px-6 py-4 align-middle text-right">
                Aksi
              </th>
            </tr>
          </thead>

          <tbody>
            {isLoading && (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-14 text-center text-sm text-zinc-500 align-middle"
                >
                  Memuat data barang...
                </td>
              </tr>
            )}

            {!isLoading && error && (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-14 text-center text-sm text-red-400 align-middle"
                >
                  {error}
                </td>
              </tr>
            )}

            {!isLoading &&
              !error &&
              data.map((item) => {
                const status = STATUS_STYLE[item.status] || STATUS_STYLE.TERSEDIA;
                const namaKategori = getKategoriNama(item.kategori);

                return (
                  <tr
                    key={item.id}
                    className="border-b border-zinc-800/70 transition-colors last:border-b-0 hover:bg-white/2"
                  >
                    <td className="px-6 py-4 align-middle text-center">
                      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-700/80 bg-zinc-800/80 shadow-inner">
                        <Package size={20} className="text-cyan-400" />
                      </div>
                    </td>

                    <td className="px-5 py-4 align-middle text-left">
                      <div className="flex flex-col gap-0.5">
                        <p className="font-semibold text-zinc-100">{item.nama}</p>
                        <p className="text-xs text-zinc-500 font-mono">
                          ID: {item.id}
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-4 align-middle text-left">
                      <span className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-800/60 px-2.5 py-1 text-xs font-medium text-zinc-300">
                        {namaKategori}
                      </span>
                    </td>

                    <td className="px-5 py-4 align-middle text-left font-mono text-xs text-zinc-400">
                      {item.sku}
                    </td>

                    <td className="px-5 py-4 align-middle text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
                          item.stok > 0
                            ? "bg-zinc-800 text-zinc-200 border border-zinc-700"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}
                      >
                        {item.stok > 0 ? "1 Unit" : "0 Unit"}
                      </span>
                    </td>

                    <td className="px-5 py-4 align-middle text-center">
                      <div className="flex items-center justify-center">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${status.className}`}
                        >
                          {item.status === "TERSEDIA"
                            ? "Tersedia"
                            : item.status === "DIPINJAM"
                            ? "Dipinjam"
                            : status.label}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 align-middle text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`${editBasePath}/${item.id}`}
                          aria-label={`Edit ${item.nama}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700/60 bg-zinc-800/60 text-zinc-400 transition hover:border-cyan-500/50 hover:bg-cyan-500/10 hover:text-cyan-400"
                        >
                          <Pencil size={15} />
                        </Link>

                        <button
                          type="button"
                          aria-label={`Hapus ${item.nama}`}
                          onClick={() => onDelete(item.id, item.nama)}
                          disabled={deletingId === item.id}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700/60 bg-zinc-800/60 text-zinc-400 transition hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

            {!isLoading && !error && data.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-14 text-center text-sm text-zinc-500"
                >
                  Tidak ada barang yang cocok dengan pencarian.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-zinc-800 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-500">
          Showing 1 to {totalItems} of {totalItems.toLocaleString("id-ID")}{" "}
          entries
        </p>

        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Halaman sebelumnya"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500 text-sm font-semibold text-[#08181a]"
          >
            1
          </button>

          <button
            type="button"
            aria-label="Halaman berikutnya"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </Card>
  );
}
