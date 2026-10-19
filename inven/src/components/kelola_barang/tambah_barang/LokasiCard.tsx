"use client";

import { Card } from "@heroui/react";
import { Archive, MapPin } from "lucide-react";
import {
  INPUT_CLASS,
  LABEL_CLASS,
  SECTION_TITLE_CLASS,
  SECTION_SUBTITLE_CLASS,
} from "@/src/lib/form_style";

type Props = {
  lokasiRak: string;
  onLokasiRakChange: (value: string) => void;
};

export function LokasiCard({ lokasiRak, onLokasiRakChange }: Props) {
  return (
    <Card className="rounded-2xl border border-zinc-800 bg-[#181919] p-6 shadow-none">
      <h3 className={SECTION_TITLE_CLASS}>Penyimpanan</h3>
      <p className={SECTION_SUBTITLE_CLASS}>Tentukan lokasi rak atau gudang.</p>

      <div className="mt-5">
        <label htmlFor="lokasi-rak" className={LABEL_CLASS}>
          <MapPin size={13} />
          Lokasi Barang
        </label>
        <div className="relative flex items-center">
          <span className="absolute left-4 text-zinc-500">
            <Archive size={16} />
          </span>
          <input
            id="lokasi-rak"
            type="text"
            value={lokasiRak}
            onChange={(event) => onLokasiRakChange(event.target.value)}
            placeholder="Cth: Rak A-01, Lemari B"
            className={`${INPUT_CLASS} pl-11`}
          />
        </div>
      </div>
    </Card>
  );
}
