"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function UpdatePasswordForm() {
  const router = useRouter(); const [password, setPassword] = useState(""); const [confirmation, setConfirmation] = useState(""); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent) { event.preventDefault(); if (password !== confirmation) return toast.error("As senhas não coincidem."); setLoading(true); try { const response = await fetch("/api/auth/update-password", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "Não foi possível atualizar a senha."); toast.success("Senha atualizada."); router.replace("/painel"); router.refresh(); } catch (error) { toast.error(error instanceof Error ? error.message : "Erro ao atualizar senha."); setLoading(false); } }
  return <form onSubmit={submit} className="space-y-5"><div><label htmlFor="new-password" className="mb-2 block text-sm font-semibold">Nova senha</label><div className="relative"><Input id="new-password" type={show ? "text" : "password"} required minLength={12} maxLength={128} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="pr-12" /><button type="button" onClick={() => setShow(!show)} aria-label={show ? "Ocultar senha" : "Mostrar senha"} className="absolute inset-y-0 right-2 my-auto grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button></div><p className="mt-2 text-xs text-slate-500">Use pelo menos 12 caracteres, combinando letras, números e símbolos.</p></div><div><label htmlFor="confirm-password" className="mb-2 block text-sm font-semibold">Confirmar nova senha</label><Input id="confirm-password" type={show ? "text" : "password"} required minLength={12} autoComplete="new-password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} /></div><Button className="w-full" size="lg" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : <Save />}{loading ? "Atualizando..." : "Atualizar senha"}</Button></form>;
}
