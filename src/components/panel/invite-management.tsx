"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import { ptBR } from "date-fns/locale";
import { Ban, Copy, Loader2, MessageCircle, Send, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { InviteRow, InviteStatus } from "@/types/database";

const statusLabel: Record<InviteStatus, string> = { pending: "Pendente", completed: "Respondido", expired: "Expirado", cancelled: "Cancelado" };
const statusTone: Record<InviteStatus, "warning" | "success" | "neutral" | "danger"> = { pending: "warning", completed: "success", expired: "neutral", cancelled: "danger" };

function effectiveStatus(invite: InviteRow): InviteStatus {
  if (invite.status === "pending" && new Date(invite.expires_at).getTime() < Date.now()) return "expired";
  return invite.status;
}

function buildMessage(template: string, patientName: string, link: string): string {
  const withName = template.replaceAll("{NOME}", patientName);
  if (withName.includes("{LINK}")) return withName.replaceAll("{LINK}", link);
  return `${withName}\n${link}`;
}

export function InviteManagement({ invites, baseUrl, messageTemplate }: { invites: InviteRow[]; baseUrl: string; messageTemplate: string }) {
  const router = useRouter();
  const [patientName, setPatientName] = useState("");
  const [patientContact, setPatientContact] = useState("");
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);
  const [loadingId, setLoadingId] = useState("");
  const [lastInvite, setLastInvite] = useState<{ name: string; link: string } | null>(null);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setCreating(true);
    try {
      const response = await fetch("/api/invites", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ patientName, patientContact, notes }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível gerar o convite.");
      const link = `${baseUrl}/questionario?convite=${data.token}`;
      setLastInvite({ name: patientName, link });
      setPatientName("");
      setPatientContact("");
      setNotes("");
      toast.success("Link gerado com sucesso.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setCreating(false);
    }
  }

  async function copy(token: string) {
    await navigator.clipboard.writeText(`${baseUrl}/questionario?convite=${token}`);
    toast.success("Link copiado.");
  }

  async function copyMessage(name: string, link: string) {
    await navigator.clipboard.writeText(buildMessage(messageTemplate, name, link));
    toast.success("Mensagem copiada. É só colar no WhatsApp da paciente.");
  }

  async function cancel(id: string) {
    if (!window.confirm("Cancelar este convite? O link deixará de funcionar.")) return;
    setLoadingId(id);
    try {
      const response = await fetch(`/api/invites/${id}`, { method: "PATCH" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível cancelar.");
      toast.success("Convite cancelado.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoadingId("");
    }
  }

  async function remove(id: string, patientName: string) {
    if (!window.confirm(`Excluir definitivamente o convite de "${patientName}"? Essa ação não pode ser desfeita (a resposta da paciente, se houver, não é apagada).`)) return;
    setLoadingId(id);
    try {
      const response = await fetch(`/api/invites/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível excluir.");
      toast.success("Convite excluído.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoadingId("");
    }
  }

  const pendingCount = invites.filter((invite) => effectiveStatus(invite) === "pending").length;
  const completedCount = invites.filter((invite) => effectiveStatus(invite) === "completed").length;

  return (
    <div className="space-y-6">
      <form onSubmit={create} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><UserPlus size={20} />Gerar novo link para paciente</h2>
        <p className="mt-1 text-sm text-slate-500">Crie um link individual, envie para a paciente e acompanhe abaixo se ela já respondeu.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="md:col-span-1">
            <label className="mb-1.5 block text-sm font-semibold" htmlFor="invite-name">Nome do paciente</label>
            <Input id="invite-name" value={patientName} onChange={(e) => setPatientName(e.target.value)} required minLength={2} />
          </div>
          <div className="md:col-span-1">
            <label className="mb-1.5 block text-sm font-semibold" htmlFor="invite-contact">Telefone ou e-mail (opcional)</label>
            <Input id="invite-contact" value={patientContact} onChange={(e) => setPatientContact(e.target.value)} />
          </div>
          <div className="md:col-span-1">
            <label className="mb-1.5 block text-sm font-semibold" htmlFor="invite-notes">Observação interna (opcional)</label>
            <Input id="invite-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <Button className="mt-4" disabled={creating}>{creating ? <Loader2 className="animate-spin" /> : <Send />}Gerar link</Button>
        {lastInvite && (
          <div className="mt-5 space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="break-all text-sm font-semibold text-emerald-900">{lastInvite.link}</p>
              <Button type="button" size="sm" variant="secondary" onClick={() => navigator.clipboard.writeText(lastInvite.link).then(() => toast.success("Link copiado."))}><Copy size={16} />Copiar link</Button>
            </div>
            <Button type="button" size="sm" onClick={() => copyMessage(lastInvite.name, lastInvite.link)}><MessageCircle size={16} />Copiar mensagem para o WhatsApp</Button>
          </div>
        )}
      </form>

      <div className="flex flex-wrap gap-3">
        <Badge tone="warning">Pendentes: {pendingCount}</Badge>
        <Badge tone="success">Respondidos: {completedCount}</Badge>
        <Badge tone="neutral">Total: {invites.length}</Badge>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4"><h2 className="font-semibold">Convites gerados</h2></div>
        {invites.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">Nenhum convite gerado ainda.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {invites.map((invite) => {
              const status = effectiveStatus(invite);
              return (
                <div key={invite.id} className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1fr)_150px_170px_auto] md:items-center">
                  <div>
                    <p className="font-semibold">{invite.patient_name}</p>
                    {invite.patient_contact && <p className="mt-1 text-sm text-slate-500">{invite.patient_contact}</p>}
                    {invite.notes && <p className="mt-1 text-xs text-slate-400">{invite.notes}</p>}
                  </div>
                  <div><Badge tone={statusTone[status]}>{statusLabel[status]}</Badge></div>
                  <div className="text-sm text-slate-500">
                    <p>Criado {formatInTimeZone(new Date(invite.created_at), "America/Sao_Paulo", "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                    {invite.creator?.nome && <p>por {invite.creator.nome}</p>}
                    {status === "completed" && invite.completed_at && <p>Respondido {formatInTimeZone(new Date(invite.completed_at), "America/Sao_Paulo", "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>}
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    {status === "completed" && invite.submission_id && <Button size="sm" variant="secondary" onClick={() => router.push(`/painel/respostas/${invite.submission_id}`)}>Ver resposta</Button>}
                    {status === "pending" && <Button size="sm" variant="ghost" onClick={() => copy(invite.token)}><Copy size={16} />Copiar link</Button>}
                    {status === "pending" && <Button size="sm" variant="secondary" onClick={() => copyMessage(invite.patient_name, `${baseUrl}/questionario?convite=${invite.token}`)}><MessageCircle size={16} />Copiar mensagem</Button>}
                    {status === "pending" && <Button size="sm" variant="danger" onClick={() => cancel(invite.id)} disabled={loadingId === invite.id}><Ban size={16} />Cancelar</Button>}
                    <Button size="sm" variant="ghost" onClick={() => remove(invite.id, invite.patient_name)} disabled={loadingId === invite.id}>{loadingId === invite.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}Excluir</Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
