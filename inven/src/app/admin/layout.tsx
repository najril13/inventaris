import React from "react";
import { getSession } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "../../components/layout/Sidebar";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pengguna = await getSession();

  if (!pengguna) {
    redirect("/login");
  }

  if (pengguna.role !== "Admin") {
    redirect("/unauthorized");
  }

  return (
    <div className="flex min-h-screen bg-[#101111] text-zinc-100">
      {/* SIDEBAR COMPONENT */}
      <Sidebar />

      {/* MAIN CONTENT */}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
