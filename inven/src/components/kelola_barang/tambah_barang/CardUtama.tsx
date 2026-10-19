"use client";

import { Card } from "@heroui/react";
import { Package } from "lucide-react";
import {
  INPUT_CLASS,
  LABEL_CLASS,
  SECTION_TITLE_CLASS,
  SECTION_SUBTITLE_CLASS,
} from "@/src/lib/form_style";

type ItemCondition = "BARU" | "BEKAS";

type Kategori = { id: string; nama: string };

type Props = {
  nama: string;
  onNamaChange: (value: string) => void;
  kategoriId: string;
  onKategoriChange: (value: string) => void;
  kategoriList: Kategori[];
  isLoadingKategori: boolean;
  sku: string;
  onSkuChange: (value: string) => void;
  merek: string;
  onMerekChange: (value: string) => void;
  kondisi: ItemCondition;
  onKondisiChange: (value: ItemCondition) => void;
};

export function InformasiUtamaCard({
  nama,
  onNamaChange,
  kategoriId,
  onKategoriChange,
  kategoriList,
  isLoadingKategori,
  sku,
  onSkuChange,
  merek,
  onMerekChange,
  kondisi,
  onKondisiChange,
}: Props) {
  return (
    <Card className="rounded-2xl border border-zinc-800 bg-[#181919] p-6 lg:p-8 shadow-none">
      <div className="mb-6">
        <h3 className={SECTION_TITLE_CLASS}>
          <Package size={20} className="text-cyan-400" />
          Informasi Utama
        </h3>
        <p className={SECTION_SUBTITLE_CLASS}>
          Data dasar barang seperti nama, identitas, dan kategori.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label htmlFor="nama-barang" className={LABEL_CLASS}>
            Nama Barang *
          </label>
          <input
            id="nama-barang"
            type="text"
            value={nama}
            onChange={(event) => onNamaChange(event.target.value)}
            placeholder='Cth: MacBook Pro 16" M2 Max 2023'
            className={INPUT_CLASS}
            autoComplete="off"
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="kategori-barang" className={LABEL_CLASS}>
              Kategori *
            </label>
            <select
              id="kategori-barang"
              value={kategoriId}
              onChange={(event) => onKategoriChange(event.target.value)}
              disabled={isLoadingKategori || kategoriList.length === 0}
              className={`${INPUT_CLASS} appearance-none disabled:opacity-50`}
            >
              {isLoadingKategori && (
                <option value="">Memuat kategori...</option>
              )}

              {!isLoadingKategori && kategoriList.length === 0 && (
                <option value="">Belum ada jenis barang</option>
              )}

              {!isLoadingKategori && kategoriList.length > 0 && (
                <>
                  <option value="" disabled>
                    Pilih kategori
                  </option>
                  {kategoriList.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                      className="bg-[#181919] text-zinc-200"
                    >
                      {item.nama}
                    </option>
                  ))}
                </>
              )}
            </select>
            {!isLoadingKategori && kategoriList.length === 0 && (
              <p className="mt-1.5 text-xs text-amber-400">
                Tambahkan Jenis Barang terlebih dahulu di menu Kelola Jenis
                Barang.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="sku-barang" className={LABEL_CLASS}>
              SKU / Kode Barang *
            </label>
            <input
              id="sku-barang"
              type="text"
              value={sku}
              onChange={(event) => onSkuChange(event.target.value)}
              placeholder="Cth: EL-MBP-001"
              className={`${INPUT_CLASS} font-mono uppercase`}
              required
            />
          </div>

          <div>
            <label htmlFor="merek-barang" className={LABEL_CLASS}>
              Merek (Opsional)
            </label>
            <input
              id="merek-barang"
              type="text"
              value={merek}
              onChange={(event) => onMerekChange(event.target.value)}
              placeholder="Cth: Apple, Samsung"
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Kondisi</label>
            <div className="flex gap-3">
              {(["BARU", "BEKAS"] as ItemCondition[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => onKondisiChange(k)}
                  className={`flex-1 rounded-xl border h-11 text-sm font-medium transition ${
                    kondisi === k
                      ? "border-cyan-400 bg-cyan-500/10 text-cyan-400"
                      : "border-zinc-700 bg-[#0f1010] text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                  }`}
                >
                  {k === "BARU" ? "Baru" : "Bekas"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
