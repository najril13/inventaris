"use client";

import { Card } from "@heroui/react";
import { ImagePlus } from "lucide-react";
import {
  SECTION_TITLE_CLASS,
  SECTION_SUBTITLE_CLASS,
} from "@/src/lib/form_style";

export function MediaCard() {
  return (
    <Card className="rounded-2xl border border-zinc-800 bg-[#181919] p-6 shadow-none">
      <h3 className={SECTION_TITLE_CLASS}>Media Barang</h3>
      <p className={SECTION_SUBTITLE_CLASS}>Unggah foto terbaik barang ini.</p>

      <div className="mt-5">
        <label
          htmlFor="gambar-barang"
          className="group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-zinc-700 bg-[#0f1010] p-10 text-center transition-all hover:border-cyan-500 hover:bg-cyan-500/5 cursor-pointer"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/80 transition-colors group-hover:bg-cyan-500/20 group-hover:text-cyan-400">
            <ImagePlus
              size={28}
              className="text-zinc-400 group-hover:text-cyan-400"
            />
          </div>
          <div>
            <span className="block text-sm font-semibold text-zinc-300">
              Unggah Gambar
            </span>
            <span className="mt-1 block text-xs text-zinc-500">
              Maks. ukuran file 5MB (JPG/PNG)
            </span>
          </div>
          <input
            id="gambar-barang"
            type="file"
            accept="image/*"
            className="hidden"
          />
        </label>
      </div>
    </Card>
  );
}
