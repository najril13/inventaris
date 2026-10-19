"use client";

import { useState } from "react";
import { Card, Button } from "@heroui/react";
import {
  Hash,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Loader2,
  Wand2,
} from "lucide-react";
import { toast } from "@/src/lib/toast";
import { ConfirmDialog } from "@/src/components/kelola_barang/ConfirmDialog";

export type UnitItem = {
  id: string;
  kodeUnit: string | null;
  serialNumber: string;
  kondisi: string;
  status: "TERSEDIA" | "DIPINJAM" | "RUSAK" | "HILANG" | string;
  lokasiRak: string | null;
  catatan: string | null;
  transaksi?: Array<{
    id: string;
    status: string;
    pengguna: {
      id: string;
      nama: string;
      email: string;
    };
  }>;
};

type Props = {
  barangId: string;
  sku: string;
  units: UnitItem[];
  onUnitsUpdated: () => void;
};

export function KelolaUnitSection({
  barangId,
  sku,
  units,
  onUnitsUpdated,
}: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [newSN, setNewSN] = useState("");
  const [bulkCount, setBulkCount] = useState(3);
  const [showBulk, setShowBulk] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State dialog hapus unit
  const [deleteTarget, setDeleteTarget] = useState<UnitItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // State ubah kondisi
  const [editingKondisiId, setEditingKondisiId] = useState<string | null>(null);

  const totalUnit = units.length;
  const tersediaCount = units.filter((u) => u.status === "TERSEDIA").length;
  const dipinjamCount = units.filter((u) => u.status === "DIPINJAM").length;
  const rusakCount = units.filter((u) => u.status === "RUSAK").length;

  const handleAddUnit = async () => {
    const trimmed = newSN.trim();
    if (!trimmed) {
      toast.error("Nomor seri wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/barang/${barangId}/units`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serialNumber: trimmed }),
      });

      const result = await res.json();
      if (!res.ok) {
        toast.error("Gagal menambah unit", result.error);
        return;
      }

      toast.success("Unit Berhasil Ditambahkan", `Nomor seri ${trimmed} terdaftar`);
      setNewSN("");
      setIsAdding(false);
      onUnitsUpdated();
    } catch {
      toast.error("Terjadi kesalahan", "Tidak dapat terhubung ke server");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkAdd = async () => {
    const prefix = sku.trim() ? `${sku.trim().toUpperCase()}-` : "SN-";
    const count = Math.min(Math.max(1, bulkCount), 30);

    const generated: string[] = [];
    const existingSNs = units.map((u) => u.serialNumber);

    let counter = 1;
    while (generated.length < count && counter <= 999) {
      const candidate = `${prefix}${String(counter).padStart(3, "0")}`;
      if (!existingSNs.includes(candidate) && !generated.includes(candidate)) {
        generated.push(candidate);
      }
      counter++;
    }

    if (generated.length === 0) {
      toast.error("Gagal men-generate nomor seri baru");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/barang/${barangId}/units`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serialNumbers: generated }),
      });

      const result = await res.json();
      if (!res.ok) {
        toast.error("Gagal menambah unit", result.error);
        return;
      }

      toast.success("Unit Ditambahkan", `${generated.length} unit berhasil ditambahkan`);
      setShowBulk(false);
      onUnitsUpdated();
    } catch {
      toast.error("Terjadi kesalahan", "Tidak dapat terhubung ke server");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUnit = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/barang/units/${deleteTarget.id}`, {
        method: "DELETE",
      });

      const result = await res.json();
      if (!res.ok) {
        toast.error("Gagal menghapus unit", result.error);
        return;
      }

      toast.success("Unit Dihapus", `Nomor seri ${deleteTarget.serialNumber} dihapus`);
      setDeleteTarget(null);
      onUnitsUpdated();
    } catch {
      toast.error("Terjadi kesalahan", "Tidak dapat terhubung ke server");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleChangeKondisi = async (unitId: string, newKondisi: string, newStatus?: string) => {
    setEditingKondisiId(unitId);
    try {
      const payload: Record<string, string> = { kondisi: newKondisi };
      if (newStatus) payload.status = newStatus;

      const res = await fetch(`/api/barang/units/${unitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        toast.error("Gagal memperbarui kondisi", result.error);
        return;
      }

      toast.success("Kondisi Diperbarui");
      onUnitsUpdated();
    } catch {
      toast.error("Terjadi kesalahan", "Tidak dapat terhubung ke server");
    } finally {
      setEditingKondisiId(null);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "TERSEDIA":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-900/50 bg-emerald-950/30 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
            <CheckCircle2 size={11} />
            Tersedia
          </span>
        );
      case "DIPINJAM":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-cyan-900/50 bg-cyan-950/30 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-400">
            <RotateCcw size={11} />
            Dipinjam
          </span>
        );
      case "RUSAK":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-900/50 bg-amber-950/30 px-2.5 py-0.5 text-[11px] font-semibold text-amber-400">
            <AlertTriangle size={11} />
            Rusak
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-400">
            {status}
          </span>
        );
    }
  };

  return (
    <Card className="rounded-2xl border border-zinc-800 bg-[#181919] p-6 shadow-none">
      {/* HEADER UNIT SECTION */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-5">
        <div>
          <h3 className="text-lg font-bold text-zinc-100">
            Kelola Unit Fisik (Serial Number)
          </h3>
          <p className="mt-0.5 text-xs text-zinc-400">
            Total {totalUnit} unit terdaftar &middot; {tersediaCount} siap dipinjam &middot; {dipinjamCount} sedang dipinjam &middot; {rusakCount} rusak
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            type="button"
            onPress={() => setShowBulk(!showBulk)}
            className="h-9 rounded-xl border border-zinc-700 bg-transparent px-3 text-xs font-semibold text-zinc-300 hover:bg-zinc-800"
          >
            <Wand2 size={14} />
            Generate Massal
          </Button>

          <Button
            size="sm"
            type="button"
            onPress={() => setIsAdding(!isAdding)}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-cyan-500 px-3.5 text-xs font-semibold text-[#08181a] hover:bg-cyan-400"
          >
            <Plus size={15} strokeWidth={2.2} />
            Tambah Unit
          </Button>
        </div>
      </div>

      {/* FORM GENERATE MASSAL */}
      {showBulk && (
        <div className="mt-4 rounded-xl border border-cyan-500/30 bg-[#101111] p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-300 font-semibold">
            <span>Generate Otomatis Unit Baru (Prefix: {sku ? `${sku.toUpperCase()}-` : "SN-"})</span>
            <button
              type="button"
              onClick={() => setShowBulk(false)}
              className="text-zinc-500 hover:text-white"
            >
              Batal
            </button>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={30}
              value={bulkCount}
              onChange={(e) => setBulkCount(parseInt(e.target.value, 10) || 1)}
              className="h-10 w-28 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-xs text-zinc-200 outline-none focus:border-cyan-500"
            />
            <span className="text-xs text-zinc-400">unit sekaligus</span>
            <Button
              size="sm"
              type="button"
              onPress={handleBulkAdd}
              isDisabled={isSubmitting}
              className="ml-auto h-10 rounded-xl bg-cyan-500 px-4 text-xs font-semibold text-[#08181a] hover:bg-cyan-400"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : "Buat Sekarang"}
            </Button>
          </div>
        </div>
      )}

      {/* FORM INPUT SINGLE UNIT */}
      {isAdding && (
        <div className="mt-4 rounded-xl border border-zinc-700 bg-[#101111] p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-300 font-semibold">
            <span>Daftarkan 1 Nomor Seri Baru</span>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-zinc-500 hover:text-white"
            >
              Batal
            </button>
          </div>
          <div className="flex gap-2">
            <div className="flex h-10 flex-1 items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3">
              <Hash size={14} className="text-zinc-500" />
              <input
                type="text"
                value={newSN}
                onChange={(e) => setNewSN(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddUnit();
                  }
                }}
                placeholder="Nomor Seri (contoh: SN-LNVO-098)"
                className="w-full bg-transparent text-xs text-zinc-200 outline-none placeholder:text-zinc-600"
              />
            </div>
            <Button
              size="sm"
              type="button"
              onPress={handleAddUnit}
              isDisabled={isSubmitting || !newSN.trim()}
              className="h-10 rounded-xl bg-cyan-500 px-4 text-xs font-semibold text-[#08181a] hover:bg-cyan-400"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : "Simpan Unit"}
            </Button>
          </div>
        </div>
      )}

      {/* TABEL UNIT */}
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-160 border-collapse text-xs">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-500 text-left font-semibold uppercase tracking-wider">
              <th className="py-3 px-3">No</th>
              <th className="py-3 px-3">Nomor Seri (SN)</th>
              <th className="py-3 px-3">Kode Unit</th>
              <th className="py-3 px-3">Kondisi</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3">Peminjam Saat Ini</th>
              <th className="py-3 px-3 text-right">Aksi</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-800/60">
            {units.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-500">
                  Belum ada unit fisik ber-SN untuk barang ini. Klik &quot;Tambah Unit&quot; untuk menambahkan.
                </td>
              </tr>
            ) : (
              units.map((u, idx) => {
                const activeLoan = u.transaksi && u.transaksi.length > 0 ? u.transaksi[0] : null;

                return (
                  <tr key={u.id} className="hover:bg-white/1.5 transition-colors">
                    <td className="py-3 px-3 font-mono text-zinc-500">{idx + 1}</td>
                    <td className="py-3 px-3 font-mono font-bold text-cyan-400">
                      {u.serialNumber}
                    </td>
                    <td className="py-3 px-3 font-mono text-zinc-400">
                      {u.kodeUnit || "-"}
                    </td>
                    <td className="py-3 px-3">
                      <select
                        value={u.kondisi}
                        disabled={editingKondisiId === u.id}
                        onChange={(e) => handleChangeKondisi(u.id, e.target.value)}
                        className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-300 outline-none cursor-pointer"
                      >
                        <option value="BAIK">Baik</option>
                        <option value="RUSAK_RINGAN">Rusak Ringan</option>
                        <option value="RUSAK_BERAT">Rusak Berat</option>
                      </select>
                    </td>
                    <td className="py-3 px-3">{renderStatusBadge(u.status)}</td>
                    <td className="py-3 px-3 text-zinc-400">
                      {activeLoan ? (
                        <span className="font-medium text-zinc-200">
                          {activeLoan.pengguna.nama}
                        </span>
                      ) : (
                        <span className="text-zinc-600">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {u.status !== "DIPINJAM" ? (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(u)}
                          aria-label={`Hapus unit ${u.serialNumber}`}
                          className="rounded-lg p-1.5 text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      ) : (
                        <span className="text-[10px] text-zinc-600">Dipinjam</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* DIALOG KONFIRMASI HAPUS */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Hapus Unit Fisik?"
        description={`Apakah Anda yakin ingin menghapus unit fisik nomor seri "${deleteTarget?.serialNumber}" dari barang ini?`}
        confirmLabel="Hapus Unit"
        isLoading={isDeleting}
        onConfirm={handleDeleteUnit}
        onCancel={() => setDeleteTarget(null)}
      />
    </Card>
  );
}
