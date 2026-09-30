import type { Metadata } from "next";
import { RecordList } from "@/components/record-list";

export const metadata: Metadata = { title: "Support" };

export default function SupportPage() {
  return <RecordList view="support" />;
}
