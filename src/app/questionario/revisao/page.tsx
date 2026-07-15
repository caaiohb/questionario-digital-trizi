import type { Metadata } from "next";
import { ReviewClient } from "@/components/questionnaire/review-client";
export const metadata: Metadata = { title: "Revisar questionário", robots: { index: false, follow: false } };
export default function ReviewPage() { return <ReviewClient />; }
