"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  Boxes,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShieldCheck,
  Users,
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
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Kelola Pengguna",
    href: "/admin/pengguna",
    icon: Users,
  },
  {
    label: "Kelola Jenis Barang",
    href: "/admin/jenis_barang",
    icon: Boxes,
  },
  {
    label: "Kelola Barang",
    href: "/admin/barang",
    icon: Package,
  },
  {
    label: "Kelola Transaksi",
    href: "/admin/transaksi",
    icon: ArrowLeftRight,
  },
  {
    label: "Pengaturan Akun",
    href: "/admin/pengaturan",
    icon: Settings,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const isMenuActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
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
        <Link href="/admin" className="group flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-400 transition group-hover:border-cyan-400/40 group-hover:bg-cyan-400/15">
            <ShieldCheck size={24} strokeWidth={1.8} />
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-cyan-400">
              Admin Panel
            </h1>

            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              System Operator
            </p>
          </div>
        </Link>
      </div>

      {/* NAVIGATION */}
      <div className="flex-1 overflow-y-auto px-5 py-7">
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
          Menu Utama
        </p>

        <nav className="space-y-1.5">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isMenuActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex min-h-12 w-full items-center gap-3 rounded-lg px-3.5 text-left text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-cyan-400/10 text-cyan-400"
                    : "text-zinc-400 hover:bg-white/[0.035] hover:text-zinc-100"
                }`}
              >
                {active && (
                  <span className="absolute -left-5 h-7 w-0.75 rounded-r-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.65)]" />
                )}

                <Icon
                  size={19}
                  strokeWidth={active ? 2.1 : 1.8}
                  className={
                    active
                      ? "text-cyan-400"
                      : "text-zinc-500 transition-colors group-hover:text-zinc-300"
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
                <AlertDialog.Dialog className="sm:max-w-100 ">
                  <AlertDialog.CloseTrigger />
                  <AlertDialog.Header>
                    <AlertDialog.Icon status="danger" />
                    <AlertDialog.Heading>Keluar dari akun?</AlertDialog.Heading>
                  </AlertDialog.Header>
                  <AlertDialog.Body>
                    <p>
                      Anda perlu login kembali untuk mengakses akun ini.
                      Pastikan seluruh perubahan sudah tersimpan.
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
            href="/admin/pengaturan"
            className="group flex items-center gap-3 transition hover:opacity-90"
          >
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 text-sm font-bold text-cyan-400">
              AD
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#191a1a] bg-emerald-400" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-zinc-200 group-hover:text-cyan-400 transition-colors">
                Administrator
              </p>

              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                Pengaturan Akun
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
