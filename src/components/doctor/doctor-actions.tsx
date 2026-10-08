"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Copy, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Atualiza a lista sozinha e mostra a quantidade de pendências no título da aba do navegador. */
export function PendingWatcher({ count }: { count: number }) {
  const router = useRouter();
  useEffect(() => {
    const original = "Área da médica";
    document.title = count > 0 ? `(${count}) Pendentes — ${original}` : original;
    const timer = window.setInterval(() => router.refresh(), 60000);
    return () => window.clearInterval(timer);
  }, [count, router]);
  return null;
}

export function CopyPromptButton({ id, size = "md" }: { id: string; size?: "sm" | "md" | "lg" }) {
  const [loading, setLoading] = useState(false);
  const [fallback, setFallback] = useState<string | null>(null);

  async function copy() {
    setLoading(true);
    try {
      const response = await fetch(`/api/submissions/${id}/ai-summary`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível gerar o prompt.");
      try {
        await navigator.clipboard.writeText(data.prompt as string);
        toast.success("Prompt copiado! Cole no seu Claude.");
        setFallback(null);
      } catch {
        setFallback(data.prompt as string);
        toast.message("Copie o texto da caixa abaixo.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao copiar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full sm:w-auto">
      <Button size={size} onClick={copy} disabled={loading}>{loading ? <Loader2 className="animate-spin" size={18} /> : <Copy size={18} />}Copiar prompt</Button>
      {fallback && <textarea readOnly value={fallback} rows={6} onFocus={(event) => event.currentTarget.select()} className="mt-3 w-full rounded-lg border p-2 text-xs" />}
    </div>
  );
}

export function AttendedButton({ id, attended, size = "md", redirectTo }: { id: string; attended: boolean; size?: "sm" | "md" | "lg"; redirectTo?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!attended && !window.confirm("Marcar este paciente como atendido? O alerta de pendência será removido.")) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/doctor/submissions/${id}/attended`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ attended: !attended }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível atualizar.");
      toast.success(attended ? "Paciente reaberto como pendente." : "Paciente marcado como atendido.");
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size={size} variant={attended ? "secondary" : "primary"} onClick={toggle} disabled={loading}>
      {loading ? <Loader2 className="animate-spin" size={18} /> : attended ? <RotateCcw size={18} /> : <CheckCircle2 size={18} />}
      {attended ? "Reabrir" : "Marcar como atendido"}
    </Button>
  );
}