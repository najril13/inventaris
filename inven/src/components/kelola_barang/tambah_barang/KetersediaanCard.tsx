"use client";

import { Card } from "@heroui/react";
import { Boxes } from "lucide-react";
import {
  INPUT_CLASS,
  LABEL_CLASS,
  SECTION_TITLE_CLASS,
  SECTION_SUBTITLE_CLASS,
} from "@/src/lib/form_style";

type ItemStatus = "TERSEDIA" | "DIPINJAM" | "HABIS";

const STATUS_LIST: { value: ItemStatus; label: string; desc: string }[] = [
  { value: "TERSEDIA", label: "Tersedia", desc: "Barang siap digunakan" },
  { value: "DIPINJAM", label: "Dipinjam", desc: "Barang sedang dipinjam" },
  { value: "HABIS", label: "Habis", desc: "Stok sedang kosong" },
];

type Props = {
  stok: string;
  onStokChange: (value: string) => void;
  status: ItemStatus;
  onStatusChange: (value: ItemStatus) => void;
};

export function KetersediaanCard({
  stok,
  onStokChange,
  status,
  onStatusChange,
}: Props) {
  return (
    <Card className="rounded-2xl border border-zinc-800 bg-[#181919] p-6 shadow-none">
      <h3 className={SECTION_TITLE_CLASS}>Ketersediaan</h3>
      <p className={SECTION_SUBTITLE_CLASS}>Jumlah stok dan status barang.</p>

      <div className="mt-6 space-y-6">
        <div>
          <label htmlFor="stok-barang" className={LABEL_CLASS}>
            <Boxes size={13} /> Stok
          </label>
          <input
            id="stok-barang"
            type="number"
            min={0}
            value={stok}
            onChange={(event) => onStokChange(event.target.value)}
            placeholder="0"
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <span className={LABEL_CLASS}>Status Ketersediaan</span>
          <div className="mt-3 flex flex-col gap-3">
            {STATUS_LIST.map((item) => (
              <label
                key={item.value}
                className={`relative flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${
                  status === item.value
                    ? "border-cyan-400 bg-cyan-500/5"
                    : "border-zinc-700 bg-[#0f1010] hover:border-zinc-500"
                }`}
              >
                <input
                  type="radio"
                  name="status_barang"
                  value={item.value}
                  checked={status === item.value}
                  onChange={() => onStatusChange(item.value)}
                  className="mt-1 h-4 w-4 shrink-0 accent-cyan-500"
                />
                <div>
                  <p
                    className={`text-sm font-semibold ${status === item.value ? "text-cyan-400" : "text-zinc-200"}`}
                  >
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">{item.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
