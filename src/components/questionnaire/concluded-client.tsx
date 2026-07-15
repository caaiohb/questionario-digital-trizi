"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { RESULT_KEY } from "@/lib/draft";
import { usePublicSettings } from "@/hooks/use-public-settings";
import { Card } from "@/components/ui/card";
import { PublicHeader } from "./public-header";
import { PublicFooter } from "./public-footer";

export function ConcludedClient() {
  const settings = usePublicSettings();
  const [protocol, setProtocol] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => { const timer = window.setTimeout(() => { try { const raw = sessionStorage.getItem(RESULT_KEY); if (!raw) return; const data = JSON.parse(raw); setProtocol(data.protocol || ""); setMessage(data.message || ""); sessionStorage.removeItem(RESULT_KEY); } catch { /* resultado indisponível */ } }, 0); return () => window.clearTimeout(timer); }, []);
  return <><PublicHeader settings={settings} /><main className="mx-auto grid min-h-[65vh] max-w-3xl place-items-center px-5 py-12"><Card className="w-full p-7 text-center sm:p-12"><CheckCircle2 className="mx-auto text-emerald-600" size={58} /><h1 className="mt-5 text-3xl font-semibold">Questionário enviado</h1><p className="mx-auto mt-3 max-w-xl leading-relaxed text-slate-600">{message || settings.finalMessage}</p>{protocol && <div className="mx-auto mt-7 max-w-md rounded-2xl bg-slate-50 p-5"><p className="text-xs font-bold uppercase tracking-widest text-slate-500">Número de protocolo</p><p className="mt-2 text-2xl font-bold tracking-wide text-[var(--trizi-primary)]">{protocol}</p><p className="mt-2 text-xs text-slate-500">Guarde este número para referência.</p></div>}<p className="mt-7 flex items-center justify-center gap-2 text-sm text-slate-500"><ShieldCheck size={17} />As informações médicas não serão exibidas novamente nesta tela.</p></Card></main><PublicFooter /></>;
}
