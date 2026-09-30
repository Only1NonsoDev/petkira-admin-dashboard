import type { Metadata } from "next";
import { RecordList } from "@/components/record-list";

export const metadata: Metadata = { title: "Bugs" };

export default function BugsPage() {
  return <RecordList view="bugs" />;
}
