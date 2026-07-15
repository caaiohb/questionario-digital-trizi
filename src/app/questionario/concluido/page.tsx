import type { Metadata } from "next";
import { ConcludedClient } from "@/components/questionnaire/concluded-client";
export const metadata: Metadata = { title: "Questionário enviado", robots: { index: false, follow: false } };
export default function ConcludedPage() { return <ConcludedClient />; }
