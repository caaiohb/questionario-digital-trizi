import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { questionnaireSections } from "@/config/questionnaireConfig";
import { CustomQuestionsManagement } from "@/components/admin/custom-questions-management";
import type { CustomQuestionRow } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function CustomQuestionsPage() {
  await requireAdmin();
  const admin = createAdminClient();
  const { data } = await admin
    .from("custom_questions")
    .select("*,creator:profiles!custom_questions_created_by_fkey(id,nome)")
    .order("section_id")
    .order("sort_order");

  const sections = questionnaireSections.map((section) => ({ id: section.id, title: section.title }));

  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-widest text-[#8c744f]">Administração</p>
      <h1 className="mt-2 text-3xl font-semibold">Perguntas por sexo</h1>
      <p className="mt-2 mb-7 text-slate-600">
        Adicione perguntas simples (sim/não ou texto) a qualquer seção existente do questionário, direcionadas para pacientes do sexo feminino, masculino ou todos.
        As perguntas clínicas já existentes (aprovadas pela equipe médica) não são editáveis por aqui — fale comigo para alterar o conteúdo delas.
      </p>
      <CustomQuestionsManagement sections={sections} questions={(data ?? []) as CustomQuestionRow[]} />
    </div>
  );
}
