import type { Metadata } from "next";
import { RecordList } from "@/components/record-list";

export const metadata: Metadata = { title: "Sentry" };

export default function SentryPage() {
  return <RecordList view="sentry" />;
}
