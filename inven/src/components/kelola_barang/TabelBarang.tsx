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

export type ItemStatus = "TERSEDIA" | "DIPINJAM" | "HABIS";

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

const STATUS_STYLE: Record<ItemStatus, { label: string; className: string }> = {
  TERSEDIA: {
    label: "Tersedia",
    className: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
  },
  DIPINJAM: {
    label: "Dipinjam",
    className: "border-zinc-600/60 bg-zinc-700/40 text-zinc-300",
  },
  HABIS: {
    label: "Habis",
    className: "border-red-500/30 bg-red-500/10 text-red-400",
  },
};

type Props = {
  data: InventoryItem[];
  isLoading: boolean;
  error: string | null;
  deletingId: string | null;
  onDelete: (id: string, nama: string) => void;
};

export function BarangTable({
  data,
  isLoading,
  error,
  deletingId,
  onDelete,
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
            <tr className="border-b border-zinc-800 bg-white/1.5">
              <th className="w-16 px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Gambar
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Nama Barang
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Kategori
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                SKU
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Ketersediaan Unit
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
            {isLoading && (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-14 text-center text-sm text-zinc-500"
                >
                  Memuat data barang...
                </td>
              </tr>
            )}

            {!isLoading && error && (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-14 text-center text-sm text-red-400"
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
                const hasUnits = item.totalUnit !== undefined && item.totalUnit > 0;

                return (
                  <tr
                    key={item.id}
                    className="border-b border-zinc-800/70 transition-colors last:border-b-0 hover:bg-white/2"
                  >
                    <td className="px-6 py-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/80">
                        <Package size={20} className="text-cyan-400" />
                      </div>
                    </td>

                    <td className="px-4 py-4 align-middle">
                      <p className="font-medium text-zinc-200">{item.nama}</p>
                      <p className="mt-0.5 text-xs text-zinc-600">
                        ID: {item.id}
                      </p>
                    </td>

                    <td className="px-4 py-4 align-middle">
                      <span className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-800/60 px-2.5 py-1 text-xs font-medium text-zinc-300">
                        {namaKategori}
                      </span>
                    </td>

                    <td className="px-4 py-4 align-middle font-mono text-xs text-zinc-400">
                      {item.sku}
                    </td>

                    <td className="px-4 py-4 align-middle">
                      {hasUnits ? (
                        <div className="flex flex-col">
                          <span className="font-semibold text-zinc-200">
                            {item.tersediaCount} / {item.totalUnit} Unit
                          </span>
                          <span className="text-[11px] text-cyan-400/80">
                            {item.tersediaCount} Siap Dipinjam
                          </span>
                        </div>
                      ) : (
                        <span className="text-zinc-400">{item.stok} Unit</span>
                      )}
                    </td>

                    <td className="px-4 py-4 align-middle">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${status.className}`}
                      >
                        {item.status === "TERSEDIA"
                          ? `Tersedia (${item.stok})`
                          : status.label}
                      </span>
                    </td>

                    <td className="px-6 py-4 align-middle">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/barang/${item.id}`}
                          aria-label={`Edit ${item.nama}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-800 hover:text-cyan-400"
                        >
                          <Pencil size={16} />
                        </Link>

                        <button
                          type="button"
                          aria-label={`Hapus ${item.nama}`}
                          onClick={() => onDelete(item.id, item.nama)}
                          disabled={deletingId === item.id}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
                        >
                          <Trash2 size={16} />
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
