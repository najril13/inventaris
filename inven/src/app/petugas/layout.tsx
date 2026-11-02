import React from "react";
import { getSession } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import SidebarPetugas from "../../components/layout/Sidebar_petugas";

export default async function PetugasLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pengguna = await getSession();

  if (!pengguna) {
    redirect("/login");
  }

  if (pengguna.role !== "Petugas" && pengguna.role !== "Admin") {
    redirect("/unauthorized");
  }

  return (
    <div className="flex min-h-screen bg-[#101111] text-zinc-100">
      {/* SIDEBAR PETUGAS */}
      <SidebarPetugas />

      {/* MAIN CONTENT */}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
