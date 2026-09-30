import type { Metadata } from "next";
import { RecordList } from "@/components/record-list";

export const metadata: Metadata = { title: "Analytics" };

export default function AnalyticsPage() {
  return <RecordList view="analytics" />;
}
