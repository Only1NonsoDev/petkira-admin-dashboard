import type { Metadata } from "next";
import { RecordList } from "@/components/record-list";

export const metadata: Metadata = { title: "Feedback" };

export default function FeedbackPage() {
  return <RecordList view="feedback" />;
}
