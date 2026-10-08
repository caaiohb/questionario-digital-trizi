import type { Metadata } from "next";
import { requireDoctorArea } from "@/lib/auth";
import { InstituteLogo } from "@/components/brand/logo";
import { SignOutButton } from "@/components/panel/sign-out-button";
import { IdleSession } from "@/components/panel/idle-session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Área da médica", robots: { index: false, follow: false, nocache: true } };

export default async function DoctorLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireDoctorArea();
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-8">
        <InstituteLogo institutionName="Instituto Trizi" compact />
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-semibold">{profile.nome}</p>
            <p className="text-xs text-slate-500">Área da médica</p>
          </div>
          <SignOutButton />
        </div>
      </header>
      <IdleSession minutes={30} />
      <main className="mx-auto max-w-5xl p-4 sm:p-8">{children}</main>
    </div>
  );
}