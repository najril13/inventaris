"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { AlertDialog, Button } from "@heroui/react";

type NavigationItem = {
  label: string;
  href: string;
  icon: React.ElementType;
};

const navigationItems: NavigationItem[] = [
  {
    label: "Beranda",
    href: "/petugas",
    icon: LayoutDashboard,
  },
  {
    label: "Kelola Transaksi",
    href: "/petugas/transaksi",
    icon: ArrowLeftRight,
  },
  {
    label: "Pengaturan Akun",
    href: "/petugas/pengaturan",
    icon: Settings,
  },
];

export default function SidebarPetugas() {
  const pathname = usePathname();
  const router = useRouter();
  const [profileName, setProfileName] = useState("Petugas");
  const [profileInitials, setProfileInitials] = useState("PT");

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/auth/profile");
        const json = await res.json();
        if (res.ok && json.data?.nama) {
          setProfileName(json.data.nama);
          const parts = json.data.nama.trim().split(/\s+/);
          if (parts.length === 1) {
            setProfileInitials(parts[0].slice(0, 2).toUpperCase());
          } else {
            setProfileInitials(
              (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
            );
          }
        }
      } catch {
        // Abaikan jika gagal memuat nama
      }
    }
    loadProfile();
  }, []);

  const isMenuActive = (href: string) => {
    if (href === "/petugas") return pathname === "/petugas";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <aside className="sticky top-0 hidden h-screen w-70 shrink-0 flex-col border-r border-[#303334] bg-[#191a1a] md:flex">
      {/* BRAND */}
      <div className="border-b border-[#262929] px-8 py-8">
        <Link href="/petugas" className="group flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-400 transition group-hover:border-cyan-400/40 group-hover:bg-cyan-400/15">
            <ShieldCheck size={24} />
          </div>

          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight text-zinc-100 group-hover:text-cyan-400 transition-colors">
              INVENTARIS
            </h1>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400/80">
              Panel Petugas
            </span>
          </div>
        </Link>
      </div>

      {/* NAVIGATION */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mb-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          Menu Operasional
        </div>

        <nav className="flex flex-col space-y-1.5">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isMenuActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                  active
                    ? "bg-cyan-400/10 text-cyan-400"
                    : "text-zinc-400 hover:bg-[#202222] hover:text-zinc-200"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-cyan-400" />
                )}

                <Icon
                  size={20}
                  strokeWidth={active ? 2.2 : 1.8}
                  className={
                    active
                      ? "text-cyan-400"
                      : "text-zinc-500 transition group-hover:text-zinc-300"
                  }
                />

                <span className="flex-1">{item.label}</span>

                {active && (
                  <ChevronRight size={15} className="text-cyan-400/70" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* BOTTOM SECTION */}
      <div className="border-t border-[#292c2d]">
        <div className="px-5 py-4">
          {/* LOGOUT DENGAN KONFIRMASI */}
          <AlertDialog>
            <Button
              type="button"
              className="group flex min-h-11 w-full justify-start! items-center gap-3 rounded-lg bg-transparent px-3.5 text-left text-sm font-medium text-zinc-400 shadow-none transition-all hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut
                size={19}
                strokeWidth={1.8}
                className="text-zinc-500 transition group-hover:text-red-400"
              />
              <span>Keluar</span>
            </Button>

            <AlertDialog.Backdrop>
              <AlertDialog.Container>
                <AlertDialog.Dialog className="sm:max-w-100">
                  <AlertDialog.CloseTrigger />
                  <AlertDialog.Header>
                    <AlertDialog.Icon status="danger" />
                    <AlertDialog.Heading>Keluar dari akun?</AlertDialog.Heading>
                  </AlertDialog.Header>
                  <AlertDialog.Body>
                    <p>
                      Anda perlu login kembali untuk mengakses akun ini.
                      Pastikan seluruh persetujuan transaksi sudah selesai diproses.
                    </p>
                  </AlertDialog.Body>
                  <AlertDialog.Footer>
                    <Button slot="close" variant="tertiary">
                      Batal
                    </Button>
                    <Button
                      slot="close"
                      variant="danger"
                      onPress={handleLogout}
                    >
                      Ya, Keluar
                    </Button>
                  </AlertDialog.Footer>
                </AlertDialog.Dialog>
              </AlertDialog.Container>
            </AlertDialog.Backdrop>
          </AlertDialog>
        </div>

        {/* USER PROFILE */}
        <div className="border-t border-[#292c2d] px-6 py-5">
          <Link
            href="/petugas/pengaturan"
            className="group flex items-center gap-3 transition hover:opacity-90"
          >
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 text-sm font-bold text-cyan-400">
              {profileInitials}
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#191a1a] bg-emerald-400" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-zinc-200 group-hover:text-cyan-400 transition-colors">
                {profileName}
              </p>

              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                Petugas Inventaris
              </p>
            </div>

            <div className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 transition group-hover:bg-zinc-800 group-hover:text-cyan-400">
              <ChevronRight size={16} />
            </div>
          </Link>
        </div>
      </div>
    </aside>
  );
}
