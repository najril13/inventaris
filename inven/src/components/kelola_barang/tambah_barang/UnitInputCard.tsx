"use client";

import { useState } from "react";
import { Card, Button } from "@heroui/react";
import { Hash, Plus, Trash2, Wand2, ShieldCheck } from "lucide-react";
import {
  INPUT_CLASS,
  LABEL_CLASS,
  SECTION_TITLE_CLASS,
  SECTION_SUBTITLE_CLASS,
} from "@/src/lib/form_style";
import { toast } from "@/src/lib/toast";

type Props = {
  serialNumbers: string[];
  onSerialNumbersChange: (sns: string[]) => void;
  sku: string;
};

export function UnitInputCard({
  serialNumbers,
  onSerialNumbersChange,
  sku,
}: Props) {
  const [singleSN, setSingleSN] = useState("");
  const [bulkCount, setBulkCount] = useState(5);
  const [showBulkGen, setShowBulkGen] = useState(false);

  const handleAddSingle = () => {
    const trimmed = singleSN.trim();
    if (!trimmed) return;

    if (serialNumbers.includes(trimmed)) {
      toast.error("Nomor seri sudah ada di daftar");
      return;
    }

    onSerialNumbersChange([...serialNumbers, trimmed]);
    setSingleSN("");
  };

  const handleRemoveSN = (index: number) => {
    onSerialNumbersChange(serialNumbers.filter((_, i) => i !== index));
  };

  const handleBulkGenerate = () => {
    const prefix = sku.trim() ? `${sku.trim().toUpperCase()}-` : "SN-";
    const count = Math.min(Math.max(1, bulkCount), 50);

    const newSNs = [...serialNumbers];
    let addedCount = 0;
    let counter = 1;

    while (addedCount < count && counter <= 999) {
      const candidate = `${prefix}${String(counter).padStart(3, "0")}`;
      if (!newSNs.includes(candidate)) {
        newSNs.push(candidate);
        addedCount++;
      }
      counter++;
    }

    onSerialNumbersChange(newSNs);
    setShowBulkGen(false);
    toast.success("Nomor Seri Dibuat", `${addedCount} nomor seri berhasil di-generate`);
  };

  return (
    <Card className="rounded-2xl border border-zinc-800 bg-[#181919] p-6 shadow-none">
      <div className="flex items-center justify-between">
        <div>
          <h3 className={SECTION_TITLE_CLASS}>Unit Fisik & Nomor Seri</h3>
          <p className={SECTION_SUBTITLE_CLASS}>
            Daftarkan nomor seri (SN) untuk setiap unit fisik barang ini.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400">
          <ShieldCheck size={13} />
          {serialNumbers.length} Unit
        </span>
      </div>

      <div className="mt-5 space-y-4">
        {/* INPUT TUNGGAL */}
        <div>
          <label htmlFor="input-single-sn" className={LABEL_CLASS}>
            <Hash size={13} /> Tambah Nomor Seri (SN)
          </label>
          <div className="flex gap-2">
            <input
              id="input-single-sn"
              type="text"
              value={singleSN}
              onChange={(e) => setSingleSN(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSingle();
                }
              }}
              placeholder="Contoh: SN-LNVO-001"
              className={INPUT_CLASS}
            />
            <Button
              type="button"
              onPress={handleAddSingle}
              className="h-11 shrink-0 rounded-xl bg-cyan-500 px-4 text-xs font-semibold text-[#08181a] hover:bg-cyan-400"
            >
              <Plus size={16} />
              Tambah
            </Button>
          </div>
        </div>

        {/* GENERATOR CEPAT */}
        <div>
          {!showBulkGen ? (
            <button
              type="button"
              onClick={() => setShowBulkGen(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-cyan-400 transition hover:underline"
            >
              <Wand2 size={13} />
              Ingin generate banyak nomor seri otomatis?
            </button>
          ) : (
            <div className="rounded-xl border border-zinc-700/80 bg-[#101111] p-3.5 space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-300 font-medium">
                <span>Generate SN Otomatis (Prefix: {sku.trim() ? `${sku.toUpperCase()}-` : "SN-"})</span>
                <button
                  type="button"
                  onClick={() => setShowBulkGen(false)}
                  className="text-zinc-500 hover:text-white"
                >
                  Tutup
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={bulkCount}
                  onChange={(e) => setBulkCount(parseInt(e.target.value, 10) || 1)}
                  className="h-9 w-24 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-xs text-zinc-200 outline-none focus:border-cyan-500"
                  placeholder="Jumlah"
                />
                <span className="text-xs text-zinc-400">buah unit</span>
                <Button
                  size="sm"
                  type="button"
                  onPress={handleBulkGenerate}
                  className="ml-auto h-9 rounded-lg bg-cyan-500 px-3 text-xs font-semibold text-[#08181a] hover:bg-cyan-400"
                >
                  Buat Otomatis
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* DAFTAR SN YANG SUDAH DITAMBAHKAN */}
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Daftar Unit Terdaftar ({serialNumbers.length})
          </p>

          {serialNumbers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-800 p-4 text-center text-xs text-zinc-500">
              Belum ada nomor seri yang dimasukkan. Tambahkan minimal 1 unit agar barang dapat dipinjam.
            </div>
          ) : (
            <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
              {serialNumbers.map((sn, idx) => (
                <div
                  key={sn}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-[#101111] px-3 py-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-zinc-500">#{idx + 1}</span>
                    <span className="font-mono font-medium text-cyan-400">{sn}</span>
                    <span className="rounded bg-emerald-950/40 px-1.5 py-0.5 text-[10px] text-emerald-400">
                      Tersedia
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveSN(idx)}
                    aria-label={`Hapus ${sn}`}
                    className="text-zinc-500 hover:text-red-400"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
