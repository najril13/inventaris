"use client";

import { useRouter, useParams } from "next/navigation";
import { Button } from "@heroui/react";
import { ChevronLeft, Save } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "@/src/lib/toast";
import { InformasiUtamaCard } from "@/src/components/kelola_barang/tambah_barang/CardUtama";
import { DeskripsiCard } from "@/src/components/kelola_barang/tambah_barang/DeskripsiCard";
import { MediaCard } from "@/src/components/kelola_barang/tambah_barang/MediaCard";
import { LokasiCard } from "@/src/components/kelola_barang/tambah_barang/LokasiCard";
import { KelolaUnitSection, type UnitItem } from "@/src/components/kelola_barang/KelolaUnitSection";
import { Card } from "@heroui/react";
import { Boxes, CheckCircle2, RotateCcw, AlertTriangle } from "lucide-react";

type ItemCondition = "BARU" | "BEKAS";
type Kategori = { id: string; nama: string };

export default function EditBarangPage() {
  const router = useRouter();
  const params = useParams();
  const barangId = params.id as string;

  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);
  const [isLoadingKategori, setIsLoadingKategori] = useState(true);
  const [isLoadingBarang, setIsLoadingBarang] = useState(true);

  const [nama, setNama] = useState("");
  const [kategoriId, setKategoriId] = useState("");
  const [merek, setMerek] = useState("");
  const [sku, setSku] = useState("");
  const [kondisi, setKondisi] = useState<ItemCondition>("BARU");
  const [lokasiRak, setLokasiRak] = useState("");
  const [units, setUnits] = useState<UnitItem[]>([]);
  const [deskripsi, setDeskripsi] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchKategori = async () => {
      setIsLoadingKategori(true);
      try {
        const res = await fetch("/api/jenisbarang");
        const result = await res.json();
        if (res.ok) setKategoriList(result.data);
      } catch {
        toast.error("Terjadi kesalahan", "Tidak dapat memuat daftar kategori");
      } finally {
        setIsLoadingKategori(false);
      }
    };

    fetchKategori();
  }, []);

  useEffect(() => {
    if (!barangId) return;

    const fetchBarang = async () => {
      setIsLoadingBarang(true);
      try {
        const res = await fetch(`/api/barang/${barangId}`);
        const result = await res.json();

        if (!res.ok) {
          toast.error("Gagal memuat data barang", result.error);
          router.push("/admin/barang");
          return;
        }

        const data = result.data;
        setNama(data.nama);
        setKategoriId(data.kategoriId);
        setMerek(data.merek || "");
        setSku(data.sku);
        setKondisi(data.kondisi);
        setLokasiRak(data.lokasiRak || "");
        setUnits(data.units || []);
        setDeskripsi(data.deskripsi || "");
      } catch {
        toast.error("Terjadi kesalahan", "Tidak dapat terhubung ke server");
        router.push("/admin/barang");
      } finally {
        setIsLoadingBarang(false);
      }
    };

    fetchBarang();
  }, [barangId, router]);

  const isValid = nama.trim() !== "" && sku.trim() !== "" && kategoriId !== "";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid) return;

    setIsSubmitting(true);

    const payload = {
      nama: nama.trim(),
      kategoriId,
      merek: merek.trim(),
      sku: sku.trim(),
      kondisi,
      lokasiRak: lokasiRak.trim(),
      deskripsi: deskripsi.trim(),
    };

    try {
      const res = await fetch(`/api/barang/${barangId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error("Gagal menyimpan perubahan", result.error);
        return;
      }

      toast.success(
        "Barang berhasil diperbarui",
        `${payload.nama} sudah tersimpan`,
      );
      router.push("/admin/barang");
    } catch (error) {
      console.error("Gagal menyimpan perubahan:", error);
      toast.error("Terjadi kesalahan", "Tidak dapat terhubung ke server");
    } finally {
      setIsSubmitting(false);
    }
  };

  const reloadBarang = async () => {
    try {
      const res = await fetch(`/api/barang/${barangId}`);
      const result = await res.json();
      if (res.ok && result.data) {
        setUnits(result.data.units || []);
      }
    } catch {
      // silent
    }
  };

  const totalUnit = units.length;
  const tersediaCount = units.filter((u) => u.status === "TERSEDIA").length;
  const dipinjamCount = units.filter((u) => u.status === "DIPINJAM").length;
  const rusakCount = units.filter((u) => u.status === "RUSAK").length;

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-5 py-7 lg:px-8">
      {/* PAGE HEADER */}
      <section className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex w-fit items-center gap-1.5 text-sm font-medium text-zinc-400 transition hover:text-cyan-400"
        >
          <ChevronLeft size={16} />
          Kembali ke Kelola Barang
        </button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-100">
              Edit Barang & Unit
            </h2>
            <p className="mt-1.5 text-sm text-zinc-500">
              Perbarui informasi detail barang dan nomor seri fisik di sistem inventaris.
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <Button
              type="button"
              onPress={() => router.back()}
              className="h-11 rounded-xl border border-zinc-700 bg-transparent px-5 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-800"
            >
              Batal
            </Button>
            <Button
              type="button"
              onPress={() => {
                const form = document.getElementById(
                  "form-edit-barang",
                ) as HTMLFormElement;
                if (form) form.requestSubmit();
              }}
              isDisabled={!isValid || isSubmitting || isLoadingBarang}
              className="flex h-11 items-center gap-2 rounded-xl bg-cyan-500 px-5 text-sm font-semibold text-[#08181a] transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Save size={18} strokeWidth={2.2} />
              {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </div>
      </section>

      {isLoadingBarang ? (
        <p className="py-16 text-center text-sm text-zinc-500">
          Memuat data barang...
        </p>
      ) : (
        <div className="space-y-8">
          <form
            id="form-edit-barang"
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8"
          >
            {/* KOLOM KIRI */}
            <div className="space-y-6 lg:col-span-2">
              <InformasiUtamaCard
                nama={nama}
                onNamaChange={setNama}
                kategoriId={kategoriId}
                onKategoriChange={setKategoriId}
                kategoriList={kategoriList}
                isLoadingKategori={isLoadingKategori}
                sku={sku}
                onSkuChange={setSku}
                merek={merek}
                onMerekChange={setMerek}
                kondisi={kondisi}
                onKondisiChange={setKondisi}
              />
              <DeskripsiCard
                deskripsi={deskripsi}
                onDeskripsiChange={setDeskripsi}
              />
              <LokasiCard
                lokasiRak={lokasiRak}
                onLokasiRakChange={setLokasiRak}
              />
            </div>

            {/* KOLOM KANAN */}
            <div className="space-y-6 lg:col-span-1">
              <MediaCard />

              {/* RINGKASAN UNIT CARD */}
              <Card className="rounded-2xl border border-zinc-800 bg-[#181919] p-6 shadow-none">
                <h3 className="text-base font-semibold text-zinc-100">
                  Ringkasan Ketersediaan
                </h3>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Status otomatis dihitung dari nomor seri fisik terdaftar.
                </p>

                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-[#101111] p-3 text-xs">
                    <span className="flex items-center gap-2 text-zinc-400">
                      <Boxes size={14} className="text-zinc-500" />
                      Total Unit
                    </span>
                    <span className="font-bold text-zinc-100">{totalUnit} unit</span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-3 text-xs">
                    <span className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle2 size={14} />
                      Siap Dipinjam
                    </span>
                    <span className="font-bold text-emerald-400">{tersediaCount} unit</span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-cyan-900/40 bg-cyan-950/20 p-3 text-xs">
                    <span className="flex items-center gap-2 text-cyan-400">
                      <RotateCcw size={14} />
                      Sedang Dipinjam
                    </span>
                    <span className="font-bold text-cyan-400">{dipinjamCount} unit</span>
                  </div>

                  {rusakCount > 0 && (
                    <div className="flex items-center justify-between rounded-xl border border-amber-900/40 bg-amber-950/20 p-3 text-xs">
                      <span className="flex items-center gap-2 text-amber-400">
                        <AlertTriangle size={14} />
                        Rusak / Servis
                      </span>
                      <span className="font-bold text-amber-400">{rusakCount} unit</span>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* ACTIONS BAWAH (MOBILE) */}
            <div className="flex items-center gap-3 pb-8 lg:hidden lg:col-span-3">
              <Button
                type="button"
                onPress={() => router.back()}
                className="h-12 flex-1 rounded-xl border border-zinc-700 bg-transparent px-5 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-800"
              >
                Batal
              </Button>
              <Button
                type="submit"
                isDisabled={!isValid || isSubmitting}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 text-sm font-semibold text-[#08181a] transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Save size={18} strokeWidth={2.2} />
                {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </form>

          {/* KELOLA UNIT FISIK & SERIAL NUMBER */}
          <KelolaUnitSection
            barangId={barangId}
            sku={sku}
            units={units}
            onUnitsUpdated={reloadBarang}
          />
        </div>
      )}
    </main>
  );
}
