"use client";

import Link from "next/link";
import { Card } from "@heroui/react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "@/src/lib/toast";
import { ConfirmDialog } from "@/src/components/kelola_barang/ConfirmDialog";

type JenisBarang = {
  id: string;
  nama: string;
  deskripsi: string | null;
  _count: {
    barang: number;
  };
};

export default function KelolaJenisBarangPage() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<JenisBarang[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<JenisBarang | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchJenisBarang = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/jenisbarang");
      const result = await res.json();

      if (!res.ok) throw new Error(result.error || "Gagal memuat data");

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchJenisBarang();
  }, []);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/jenisbarang/${deleteTarget.id}`, { method: "DELETE" });
      const result = await res.json();

      if (!res.ok) {
        toast.error("Gagal menghapus", result.error);
        return;
      }

      setData((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      toast.success("Jenis barang dihapus", `${deleteTarget.nama} sudah dihapus`);
      setDeleteTarget(null);
    } catch {
      toast.error("Terjadi kesalahan", "Tidak dapat terhubung ke server");
    } finally {
      setIsDeleting(false);
    }
  };

  const totalJenis = data.length;

  const filteredData = useMemo(() => {
    return data.filter((item) =>
      item.nama.toLowerCase().includes(query.toLowerCase()),
    );
  }, [data, query]);

  return (
    <main className="space-y-8 px-5 py-7 lg:px-8">
      {/* PAGE HEADER */}
      <section>
        <h2 className="text-3xl font-bold tracking-tight text-white">
          Kelola Jenis Barang
        </h2>
        <p className="mt-1.5 text-sm text-zinc-500">
          Manajemen kategori dan pengelompokan barang dalam sistem.
        </p>
      </section>

      {/* SEARCH + ACTION */}
      <Card className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-[#181919] p-5 shadow-none sm:flex-row sm:items-center sm:justify-between">
        <div className="flex h-11 items-center gap-3 rounded-xl border border-zinc-700 bg-[#101111] px-4 transition-colors focus-within:border-cyan-500 sm:max-w-md sm:flex-1">
          <Search size={18} className="shrink-0 text-zinc-400" />

          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari Jenis Barang..."
            className="h-full w-full bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
          />
        </div>

        {/* =============== TOMBOL TAMBAH JENIS BARANG (LINK) =============== */}
        <Link
          href="/admin/jenis_barang/hal_jbarang"
          className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 text-sm font-semibold text-[#08181a] transition hover:bg-cyan-400"
        >
          <Plus size={18} strokeWidth={2.2} />
          Tambah Jenis
        </Link>
      </Card>

      {/* TABLE */}
      <Card className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#181919] shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full min-w-160 border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-white/1.5">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  ID Jenis
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Nama Jenis
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Deskripsi
                </th>
                <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Jumlah Barang
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody>
              {isLoading && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-14 text-center text-sm text-zinc-500"
                  >
                    Memuat data...
                  </td>
                </tr>
              )}

              {!isLoading && error && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-14 text-center text-sm text-red-400"
                  >
                    {error}
                  </td>
                </tr>
              )}

              {!isLoading &&
                !error &&
                filteredData.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-zinc-800/70 transition-colors last:border-b-0 hover:bg-white/2"
                  >
                    <td className="px-6 py-4 align-middle font-mono text-xs text-zinc-400">
                      {item.id}
                    </td>

                    <td className="px-4 py-4 align-middle">
                      <p className="font-semibold text-zinc-100">{item.nama}</p>
                    </td>

                    <td className="px-4 py-4 align-middle text-zinc-400">
                      {item.deskripsi || "-"}
                    </td>

                    <td className="px-4 py-4 align-middle font-semibold text-cyan-400">
                      {item._count.barang.toLocaleString("id-ID")}
                    </td>

                    <td className="px-6 py-4 align-middle">
                      <div className="flex items-center justify-end gap-1">
                        {/* =============== TOMBOL EDIT (LINK DENGAN QUERY PARAM) =============== */}
                        <Link
                          href={`/admin/jenis_barang/hal_jbarang?id=${item.id}`}
                          aria-label={`Edit ${item.nama}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-800 hover:text-cyan-400"
                        >
                          <Pencil size={16} />
                        </Link>

                        <button
                          type="button"
                          aria-label={`Hapus ${item.nama}`}
                          onClick={() => setDeleteTarget(item)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-red-500/10 hover:text-red-400"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

              {!isLoading && !error && filteredData.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-14 text-center text-sm text-zinc-500"
                  >
                    Tidak ada jenis barang yang cocok dengan pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex flex-col gap-3 border-t border-zinc-800 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-500">
            Showing 1 to {filteredData.length} of{" "}
            {totalJenis.toLocaleString("id-ID")} entries
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              className="flex h-9 items-center justify-center rounded-lg px-3 text-sm font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
            >
              Previous
            </button>

            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500 text-sm font-semibold text-[#08181a]"
            >
              1
            </button>

            <button
              type="button"
              className="flex h-9 items-center justify-center rounded-lg px-3 text-sm font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
            >
              Next
            </button>
          </div>
        </div>
      </Card>

      {/* DIALOG KONFIRMASI HAPUS */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Hapus Jenis Barang"
        description={`Apakah Anda yakin ingin menghapus jenis barang "${deleteTarget?.nama}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus Jenis"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </main>
  );
}
