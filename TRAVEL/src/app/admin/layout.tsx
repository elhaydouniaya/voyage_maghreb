"use client";

import { usePathname } from "next/navigation";
import AdminPortalLayout from "@/components/layout/AdminPortalLayout";

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }
  return <AdminPortalLayout>{children}</AdminPortalLayout>;
}
