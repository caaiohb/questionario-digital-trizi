"use client";
import { useState } from "react";
import Link from "next/link";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ResetPasswordForm() {
  const [email, setEmail] = useState(""); const [loading, setLoading] = useState(false); const [sent, setSent] = useState(false);
  async function submit(event: React.FormEvent) { event.preventDefault(); setLoading(true); await fetch("/api/auth/reset-password", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) }).catch(() => undefined); setSent(true); setLoading(false); }
  if (sent) return <div className="text-center"><Mail className="mx-auto text-emerald-600" size={42} /><h2 className="mt-4 text-xl font-semibold">Verifique seu e-mail</h2><p className="mt-2 text-sm leading-relaxed text-slate-600">Caso exista um usuário ativo para o endereço informado, as instruções de recuperação serão enviadas.</p><Link className="mt-6 inline-block font-semibold text-[var(--trizi-primary)] hover:underline" href="/login">Voltar ao login</Link></div>;
  return <form onSubmit={submit} className="space-y-5"><div><label htmlFor="email" className="mb-2 block text-sm font-semibold">E-mail corporativo</label><Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div><Button className="w-full" size="lg" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : <Mail />}{loading ? "Enviando..." : "Enviar instruções"}</Button><Link className="block text-center text-sm font-semibold text-[var(--trizi-primary)] hover:underline" href="/login">Voltar ao login</Link></form>;
}
