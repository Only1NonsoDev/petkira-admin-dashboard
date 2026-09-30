import type { Metadata } from "next";
import { AdminsPanel } from "@/components/admins-panel";

export const metadata: Metadata = { title: "Admins" };

export default function AdminsPage() {
  return <AdminsPanel />;
}
