"use client";

import React, { useState } from "react";
import { Card } from "@heroui/react";
import {
  BookOpen,
  Bug,
  ChevronDown,
  LifeBuoy,
  Mail,
  MessageSquare,
  Phone,
  Search,
} from "lucide-react";

const KATEGORI_BANTUAN = [
  {
    title: "Panduan Operasional",
    deskripsi: "Pelajari cara mengelola stok dan persetujuan barang.",
    icon: BookOpen,
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
    border: "group-hover:border-cyan-500/50",
  },
  {
    title: "FAQ Petugas",
    deskripsi: "Pertanyaan seputar peminjaman dan pengelolaan unit.",
    icon: MessageSquare,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "group-hover:border-emerald-500/50",
  },
  {
    title: "Lapor Masalah",
    deskripsi: "Laporkan ketidaksesuaian stok atau kerusakan sistem.",
    icon: Bug,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "group-hover:border-amber-500/50",
  },
  {
    title: "Hubungi Admin",
    deskripsi: "Butuh koordinasi akses pengguna dengan Administrator?",
    icon: LifeBuoy,
    color: "text-rose-400",
    bg: "bg-rose-400/10",
    border: "group-hover:border-rose-500/50",
  },
];

const FAQ_DATA = [
  {
    pertanyaan: "Bagaimana cara menyetujui permohonan peminjaman dari user?",
    jawaban:
      "Di dashboard Beranda atau menu 'Kelola Transaksi', cari transaksi dengan status 'Menunggu Persetujuan'. Klik tombol hijau 'Setujui' untuk mengonfirmasi peminjaman. Sistem akan otomatis memotong stok barang dan mengubah status nomor seri barang menjadi Dipinjam.",
  },
  {
    pertanyaan: "Bagaimana jika pemohon tidak memenuhi syarat atau stok fisik habis?",
    jawaban:
      "Anda dapat menekan tombol merah 'Tolak' pada baris transaksi. Status akan berubah menjadi 'Ditolak', stok tidak akan terpotong, dan user akan melihat bahwa permohonannya ditolak.",
  },
  {
    pertanyaan: "Bagaimana cara memproses pengembalian barang yang telah dipinjam?",
    jawaban:
      "Buka menu 'Kelola Transaksi', cari transaksi barang yang sedang berstatus 'Dipinjam' atau 'Terlambat'. Klik tombol 'Kembalikan'. Sistem akan mengubah status unit barang kembali menjadi 'Tersedia' dan menambah stok barang otomatis.",
  },
  {
    pertanyaan: "Bagaimana cara menambah barang baru beserta nomor seri fisiknya?",
    jawaban:
      "Masuk ke menu 'Kelola Barang', klik 'Tambah Barang'. Masukkan nama barang, kategori, lalu tambahkan nomor seri unit (misal: SN-001, SN-002) pada kartu 'Nomor Seri Unit Fisik'. Jumlah stok akan terhitung otomatis sesuai total unit nomor seri yang ditambahkan.",
  },
  {
    pertanyaan: "Mengapa petugas tidak bisa mengakses menu Pengguna?",
    jawaban:
      "Hak akses mengelola akun pengguna, membuat akun baru, dan mengubah peran pengguna merupakan wewenang khusus Administrator. Petugas berfokus pada operasional inventaris, pencatatan transaksi, dan pengelolaan barang.",
  },
];

export default function PetugasBantuanPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const filteredFaq = FAQ_DATA.filter(
    (faq) =>
      faq.pertanyaan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.jawaban.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#101111] text-zinc-100">
      <main className="space-y-8 px-5 py-7 lg:px-8">
        {/* HERO SEARCH SECTION */}
        <section className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-[#181919] px-6 py-12 text-center sm:px-12 md:py-16">
          <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/20 p-[20%] blur-[120px]" />

          <div className="relative z-10 mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              Pusat Bantuan & Panduan Petugas
            </h2>
            <p className="mt-3 text-sm text-zinc-400 md:text-base">
              Panduan operasional harian mengenai persetujuan peminjaman, pengelolaan stok, dan pengembalian barang inventaris.
            </p>

            <div className="mx-auto mt-8 flex h-14 max-w-xl items-center gap-3 rounded-2xl border border-zinc-700/80 bg-[#101111]/80 px-5 backdrop-blur-md transition-colors focus-within:border-cyan-500">
              <Search size={20} className="shrink-0 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik pertanyaan atau kata kunci bantuan..."
                className="h-full w-full bg-transparent text-zinc-200 outline-none placeholder:text-zinc-500"
              />
            </div>
          </div>
        </section>

        {/* KATEGORI BANTUAN GRID */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KATEGORI_BANTUAN.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card
                key={index}
                className={`group cursor-pointer rounded-2xl border border-zinc-800/80 bg-[#181919] p-6 shadow-none transition-all duration-300 hover:-translate-y-1 ${item.border}`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${item.bg} ${item.color}`}
                >
                  <Icon size={24} strokeWidth={1.8} />
                </div>
                <h3 className="mt-5 font-bold tracking-wide text-zinc-100 transition-colors group-hover:text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-zinc-500">{item.deskripsi}</p>
              </Card>
            );
          })}
        </section>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* FAQ SECTION */}
          <section className="lg:col-span-2">
            <div className="mb-5">
              <h3 className="text-xl font-bold text-white">
                Pertanyaan Populer Petugas
              </h3>
              <p className="text-sm text-zinc-400">
                Solusi langsung untuk alur kerja dan persetujuan barang.
              </p>
            </div>

            <div className="flex flex-col space-y-3">
              {filteredFaq.length > 0 ? (
                filteredFaq.map((faq, index) => {
                  const isOpen = openFaqIndex === index;
                  return (
                    <div
                      key={index}
                      className={`overflow-hidden rounded-2xl border transition-colors ${
                        isOpen
                          ? "border-cyan-500/30 bg-[#181919]"
                          : "border-zinc-800/80 bg-[#181919]/50 hover:bg-[#181919]"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleFaq(index)}
                        className="flex w-full items-center justify-between px-6 py-5 text-left"
                      >
                        <span
                          className={`font-semibold ${
                            isOpen ? "text-cyan-400" : "text-zinc-200"
                          }`}
                        >
                          {faq.pertanyaan}
                        </span>
                        <ChevronDown
                          size={20}
                          className={`shrink-0 text-zinc-500 transition-transform duration-300 ${
                            isOpen ? "rotate-180 text-cyan-400" : ""
                          }`}
                        />
                      </button>

                      {isOpen && (
                        <div className="px-6 pb-5">
                          <p className="text-sm leading-relaxed text-zinc-400">
                            {faq.jawaban}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-zinc-800 bg-[#181919] p-8 text-center text-zinc-400">
                  Tidak ditemukan hasil yang cocok dengan kata kunci &quot;{searchQuery}&quot;.
                </div>
              )}
            </div>
          </section>

          {/* CONTACT & SUPPORT PANEL */}
          <section className="space-y-4">
            <div className="mb-5 lg:mb-0 lg:hidden">
              <h3 className="text-xl font-bold text-white">Kontak Internal</h3>
            </div>

            <Card className="rounded-2xl border border-zinc-800/80 bg-[#181919] p-6 shadow-none">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">
                  <Mail size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-400">
                    Administrator Sistem
                  </p>
                  <p className="mt-0.5 font-semibold text-zinc-100">
                    admin@system.com
                  </p>
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border border-zinc-800/80 bg-[#181919] p-6 shadow-none">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400">
                  <Phone size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-400">
                    Helpdesk IT Internal
                  </p>
                  <p className="mt-0.5 font-semibold text-zinc-100">
                    +62 811-2233-4455
                  </p>
                </div>
              </div>
            </Card>

            <Card className="mt-4 rounded-2xl border border-dashed border-zinc-700 bg-transparent p-6 text-center shadow-none">
              <p className="text-sm text-zinc-400">
                Jam Kerja Petugas:
                <br />
                <span className="font-semibold text-zinc-300">
                  Senin - Jumat (07:30 - 16:30 WIB)
                </span>
              </p>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}
