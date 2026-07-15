"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setLoading(true);
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível entrar.");
      toast.success("Acesso realizado com segurança.");
      const redirect = params.get("redirect");
      router.replace(redirect?.startsWith("/painel") ? redirect : "/painel");
      router.refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível entrar."); setLoading(false); }
  }

  return <form onSubmit={submit} className="space-y-5"><div><label htmlFor="email" className="mb-2 block text-sm font-semibold">E-mail</label><Input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></div><div><div className="mb-2 flex items-center justify-between"><label htmlFor="password" className="text-sm font-semibold">Senha</label><Link href="/recuperar-senha" className="text-sm font-semibold text-[var(--trizi-primary)] hover:underline">Esqueci minha senha</Link></div><div className="relative"><Input id="password" type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="pr-12" /><button type="button" onClick={() => setShow(!show)} aria-label={show ? "Ocultar senha" : "Mostrar senha"} className="absolute inset-y-0 right-2 my-auto grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div><Button type="submit" size="lg" className="w-full" disabled={loading}>{loading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}{loading ? "Entrando..." : "Entrar"}</Button></form>;
}
