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
    title: "Panduan Pengguna",
    deskripsi: "Pelajari cara menggunakan fitur-fitur aplikasi.",
    icon: BookOpen,
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
    border: "group-hover:border-cyan-500/50",
  },
  {
    title: "FAQ",
    deskripsi: "Pertanyaan yang paling sering ditanyakan.",
    icon: MessageSquare,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "group-hover:border-emerald-500/50",
  },
  {
    title: "Lapor Masalah",
    deskripsi: "Temukan bug atau error? Laporkan di sini.",
    icon: Bug,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "group-hover:border-amber-500/50",
  },
  {
    title: "Hubungi Dukungan",
    deskripsi: "Butuh bantuan langsung dari tim teknis?",
    icon: LifeBuoy,
    color: "text-rose-400",
    bg: "bg-rose-400/10",
    border: "group-hover:border-rose-500/50",
  },
];

const FAQ_DATA = [
  {
    pertanyaan: "Bagaimana cara mencatat transaksi peminjaman baru?",
    jawaban:
      "Anda dapat pergi ke menu 'Kelola Transaksi', lalu klik tombol 'CATAT PEMINJAMAN BARU' di sudut kanan atas. Isi formulir dengan data peminjam dan barang yang akan dipinjam, lalu simpan.",
  },
  {
    pertanyaan: "Apa yang terjadi jika barang terlambat dikembalikan?",
    jawaban:
      "Sistem akan secara otomatis mendeteksi tanggal pengembalian yang melewati tenggat waktu dan mengubah status transaksi menjadi 'Terlambat' dengan label berwarna merah. Notifikasi juga dapat dikirimkan ke pengguna jika fitur email diaktifkan.",
  },
  {
    pertanyaan: "Bagaimana cara menambahkan jenis barang baru?",
    jawaban:
      "Masuk ke menu 'Kelola Jenis Barang', lalu klik 'Tambah Jenis'. Anda harus memasukkan ID Jenis (misal: CAT-001), Nama Jenis, dan Deskripsi singkat mengenai kategori tersebut.",
  },
  {
    pertanyaan: "Apakah saya bisa mengubah role/hak akses seorang pengguna?",
    jawaban:
      "Ya, di halaman 'Kelola Pengguna', klik ikon titik tiga (aksi) pada baris pengguna yang ingin diubah, pilih 'Edit', lalu sesuaikan rolenya (Admin, Operator, atau User).",
  },
];

export default function BantuanPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#101111] text-zinc-100">
      <main className="space-y-8 px-5 py-7 lg:px-8">
        {/* HERO SEARCH SECTION */}
        <section className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-[#181919] px-6 py-12 text-center sm:px-12 md:py-16">
          {/* Efek Glow di Background */}
          <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/20 p-[20%] blur-[120px]" />

          <div className="relative z-10 mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              Halo, ada yang bisa kami bantu?
            </h2>
            <p className="mt-3 text-sm text-zinc-400 md:text-base">
              Cari panduan, artikel, atau ketik pertanyaan Anda di bawah ini
              untuk menemukan solusi dengan cepat.
            </p>

            <div className="mx-auto mt-8 flex h-14 max-w-xl items-center gap-3 rounded-2xl border border-zinc-700/80 bg-[#101111]/80 px-5 backdrop-blur-md transition-colors focus-within:border-cyan-500">
              <Search size={20} className="shrink-0 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik topik bantuan..."
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
                Pertanyaan Populer
              </h3>
              <p className="text-sm text-zinc-400">
                Jawaban cepat untuk pertanyaan yang sering ditanyakan.
              </p>
            </div>

            <div className="flex flex-col space-y-3">
              {FAQ_DATA.map((faq, index) => {
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
              })}
            </div>
          </section>

          {/* CONTACT & SUPPORT PANEL */}
          <section className="space-y-4">
            <div className="mb-5 lg:mb-0 lg:hidden">
              <h3 className="text-xl font-bold text-white">Hubungi Kami</h3>
            </div>

            <Card className="rounded-2xl border border-zinc-800/80 bg-[#181919] p-6 shadow-none">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">
                  <Mail size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-400">
                    Email Dukungan
                  </p>
                  <p className="mt-0.5 font-semibold text-zinc-100">
                    support@system.com
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
                    Telepon (Jam Kerja)
                  </p>
                  <p className="mt-0.5 font-semibold text-zinc-100">
                    +62 811-2233-4455
                  </p>
                </div>
              </div>
            </Card>

            <Card className="mt-4 rounded-2xl border border-dashed border-zinc-700 bg-transparent p-6 text-center shadow-none">
              <p className="text-sm text-zinc-400">
                Jam Operasional Dukungan:
                <br />
                <span className="font-semibold text-zinc-300">
                  Senin - Jumat (08:00 - 17:00 WIB)
                </span>
              </p>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}
