"use client";

import Link from "next/link";
import { Card } from "@heroui/react";
import {
  Filter,
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Users,
  ShieldCheck,
  UserCheck,
  UserX,
} from "lucide-react";
import { useEffect, useMemo, useState, useCallback } from "react";
import { ConfirmDialog } from "@/src/components/kelola_barang/ConfirmDialog";
import { toast } from "@/src/lib/toast";

type RolePengguna = "Admin" | "Petugas" | "User";
type StatusPengguna = "Active" | "Inactive";

type Pengguna = {
  id: string;
  nama: string;
  email: string;
  role: RolePengguna;
  tanggalBergabung: string;
  status: StatusPengguna;
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

export default function KelolaPenggunaPage() {
  const [penggunaList, setPenggunaList] = useState<Pengguna[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // State untuk dialog hapus
  const [deleteTarget, setDeleteTarget] = useState<Pengguna | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch daftar pengguna
  const fetchPengguna = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/pengguna");
      const result = await res.json();
      if (res.ok && Array.isArray(result.data)) {
        setPenggunaList(result.data);
      } else {
        toast.error("Gagal memuat pengguna", result.error || "Terjadi kesalahan");
      }
    } catch {
      toast.error("Terjadi kesalahan", "Tidak dapat terhubung ke server");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPengguna();
  }, [fetchPengguna]);

  // Handle Hapus
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/pengguna/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const result = await res.json();

      if (!res.ok) {
        toast.error("Gagal menghapus pengguna", result.error || "Terjadi kesalahan");
        setIsDeleting(false);
        return;
      }

      toast.success("Pengguna dihapus", `${deleteTarget.nama} berhasil dihapus`);
      setPenggunaList((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      toast.error("Terjadi kesalahan", "Tidak dapat terhubung ke server");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter Data
  const filteredData = useMemo(() => {
    return penggunaList.filter((item) => {
      const matchQuery =
        item.nama.toLowerCase().includes(query.toLowerCase()) ||
        item.email.toLowerCase().includes(query.toLowerCase());
      const matchRole = roleFilter === "ALL" || item.role === roleFilter;
      const matchStatus = statusFilter === "ALL" || item.status === statusFilter;
      return matchQuery && matchRole && matchStatus;
    });
  }, [penggunaList, query, roleFilter, statusFilter]);

  // Statistik Ringkas
  const stats = useMemo(() => {
    const total = penggunaList.length;
    const adminCount = penggunaList.filter((u) => u.role === "Admin").length;
    const activeCount = penggunaList.filter((u) => u.status === "Active").length;
    const inactiveCount = total - activeCount;
    return { total, adminCount, activeCount, inactiveCount };
  }, [penggunaList]);

  return (
    <main className="space-y-6 px-5 py-7 lg:px-8">
      {/* HEADER SECTION */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Manajemen Pengguna
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Kelola hak akses, peran, dan status akun pengguna dalam sistem.
          </p>
        </div>

        <Link href="/admin/pengguna/hal_pengguna">
          <button
            type="button"
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 text-sm font-bold tracking-wide text-[#08181a] transition hover:bg-cyan-300"
          >
            <Plus size={18} strokeWidth={2.5} />
            Tambah Pengguna
          </button>
        </Link>
      </section>

      {/* STAT CARDS */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="rounded-2xl border border-zinc-800 bg-[#181919] p-4 shadow-none">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
              <Users size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">Total Pengguna</p>
              <p className="text-xl font-bold text-white">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border border-zinc-800 bg-[#181919] p-4 shadow-none">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">Admin</p>
              <p className="text-xl font-bold text-white">{stats.adminCount}</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border border-zinc-800 bg-[#181919] p-4 shadow-none">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <UserCheck size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">Akun Aktif</p>
              <p className="text-xl font-bold text-white">{stats.activeCount}</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border border-zinc-800 bg-[#181919] p-4 shadow-none">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <UserX size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">Non-Aktif</p>
              <p className="text-xl font-bold text-white">{stats.inactiveCount}</p>
            </div>
          </div>
        </Card>
      </section>

      {/* TABLE CONTAINER */}
      <Card className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-[#181919] p-0 shadow-none">
        {/* TOP CONTROL BAR (Search & Filters) */}
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          {/* SEARCH INPUT */}
          <div className="flex h-11 w-full max-w-md items-center gap-3 rounded-xl border border-zinc-700/60 bg-[#101111] px-4 focus-within:border-cyan-500">
            <Search size={18} className="text-zinc-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari berdasarkan nama atau email..."
              className="w-full bg-transparent text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none"
            />
          </div>

          {/* FILTER CONTROLS */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter Role */}
            <div className="flex items-center gap-1.5 rounded-xl border border-zinc-700/60 bg-[#101111] px-3 py-1">
              <Filter size={14} className="text-zinc-500" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-transparent text-xs font-medium text-zinc-300 outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-[#181919] text-zinc-300">
                  Semua Role
                </option>
                <option value="Admin" className="bg-[#181919] text-zinc-300">
                  Admin
                </option>
                <option value="Petugas" className="bg-[#181919] text-zinc-300">
                  Petugas
                </option>
                <option value="User" className="bg-[#181919] text-zinc-300">
                  User
                </option>
              </select>
            </div>

            {/* Filter Status */}
            <div className="flex items-center gap-1.5 rounded-xl border border-zinc-700/60 bg-[#101111] px-3 py-1">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-xs font-medium text-zinc-300 outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-[#181919] text-zinc-300">
                  Semua Status
                </option>
                <option value="Active" className="bg-[#181919] text-zinc-300">
                  Active
                </option>
                <option value="Inactive" className="bg-[#181919] text-zinc-300">
                  Inactive
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto border-t border-zinc-800/80">
          <table className="w-full min-w-200 border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800/80 bg-[#181919]">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Nama Pengguna
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Role
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Tanggal Bergabung
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
                        Memuat data pengguna...
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
                    Tidak ada pengguna yang sesuai dengan pencarian atau filter.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-white/2"
                  >
                    {/* USER INFO */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-bold text-cyan-400 border border-zinc-700">
                          {getInitials(item.nama)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-zinc-200">
                            {item.nama}
                          </span>
                          <span className="text-xs text-zinc-500">
                            {item.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* ROLE */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ${
                          item.role === "Admin"
                            ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                            : item.role === "Petugas"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-zinc-800 text-zinc-300 border border-zinc-700"
                        }`}
                      >
                        {item.role}
                      </span>
                    </td>

                    {/* TANGGAL BERGABUNG */}
                    <td className="px-6 py-4 text-zinc-400">
                      {formatDate(item.tanggalBergabung)}
                    </td>

                    {/* STATUS */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
                          item.status === "Active"
                            ? "border-emerald-900/50 bg-emerald-950/30 text-emerald-400"
                            : "border-zinc-700/50 bg-zinc-800/30 text-zinc-400"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            item.status === "Active"
                              ? "bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.5)]"
                              : "bg-zinc-500"
                          }`}
                        />
                        {item.status}
                      </span>
                    </td>

                    {/* AKSI */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        {/* Tombol Edit */}
                        <Link
                          href={`/admin/pengguna/hal_pengguna?id=${item.id}`}
                          aria-label={`Edit ${item.nama}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-800 hover:text-cyan-400"
                        >
                          <Pencil size={16} />
                        </Link>

                        {/* Tombol Hapus */}
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(item)}
                          aria-label={`Hapus ${item.nama}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-red-500/10 hover:text-red-400"
                        >
                          <Trash2 size={16} />
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
        title="Hapus Akun Pengguna"
        description={`Apakah Anda yakin ingin menghapus akun "${deleteTarget?.nama}" (${deleteTarget?.email})? Tindakan ini akan menghapus seluruh data sesi pengguna tersebut dan tidak dapat dibatalkan.`}
        confirmLabel="Hapus Pengguna"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </main>
  );
}
