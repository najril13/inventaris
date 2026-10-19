"use client";

import { Card } from "@heroui/react";
import { Star } from "lucide-react";
import {
  TEXTAREA_CLASS,
  SECTION_TITLE_CLASS,
  SECTION_SUBTITLE_CLASS,
} from "@/src/lib/form_style";

type Props = {
  deskripsi: string;
  onDeskripsiChange: (value: string) => void;
};

export function DeskripsiCard({ deskripsi, onDeskripsiChange }: Props) {
  return (
    <Card className="rounded-2xl border border-zinc-800 bg-[#181919] p-6 lg:p-8 shadow-none">
      <div className="mb-6">
        <h3 className={SECTION_TITLE_CLASS}>
          <Star size={20} className="text-purple-400" />
          Deskripsi Lengkap
        </h3>
        <p className={SECTION_SUBTITLE_CLASS}>
          Tuliskan penjelasan detail, spesifikasi, atau panduan singkat barang.
        </p>
      </div>

      <textarea
        id="deskripsi-barang"
        rows={8}
        value={deskripsi}
        onChange={(event) => onDeskripsiChange(event.target.value)}
        placeholder="Ketik deskripsi selengkapnya di sini..."
        className={TEXTAREA_CLASS}
      />
    </Card>
  );
}
