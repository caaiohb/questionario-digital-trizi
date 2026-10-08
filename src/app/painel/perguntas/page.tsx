import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { questionnaireSections } from "@/config/questionnaireConfig";
import { loadQuestionOverrides } from "@/lib/question-overrides-server";
import { LOCKED_QUESTION_IDS } from "@/lib/question-overrides";
import { QuestionManager } from "@/components/admin/question-manager";
import type { ManagerQuestion, ManagerSection } from "@/components/admin/question-manager";
import type { CustomQuestionRow } from "@/types/database";

export const dynamic = "force-dynamic";

type Gender = "todos" | "feminino" | "masculino";

export default async function QuestionsAdminPage() {
  await requireAdmin();
  const admin = createAdminClient();
  const [{ data }, overrides] = await Promise.all([
    admin.from("custom_questions").select("*").order("sort_order"),
    loadQuestionOverrides(admin),
  ]);
  const customRows = (data ?? []) as CustomQuestionRow[];

  const dependents = new Map<string, number>();
  const addDependent = (questionId: string, count: number) => dependents.set(questionId, (dependents.get(questionId) ?? 0) + count);
  for (const section of questionnaireSections) {
    if (section.condition) addDependent(section.condition.questionId, section.questions.length);
    for (const question of section.questions) if (question.condition) addDependent(question.condition.questionId, 1);
  }

  const sections: ManagerSection[] = questionnaireSections.map((section) => {
    const sectionGender: Gender = section.condition?.equals === "feminino" || section.condition?.equals === "masculino" ? section.condition.equals : "todos";

    const standard = section.questions.map((question, index) => {
      const override = overrides[question.id];
      const questionGender: Gender = question.condition?.questionId === "identification_sex" && (question.condition.equals === "feminino" || question.condition.equals === "masculino") ? question.condition.equals : sectionGender;
      const item: ManagerQuestion = {
        id: question.id,
        kind: "padrao",
        text: question.text,
        type: question.type,
        required: Boolean(question.required),
        sensitive: Boolean(question.sensitive),
        active: override?.active ?? true,
        removed: override?.removed ?? false,
        locked: LOCKED_QUESTION_IDS.has(question.id),
        gender: questionGender,
        dependents: dependents.get(question.id) ?? 0,
      };
      return { item, order: override?.sortOrder ?? question.order, index };
    });

    const custom = customRows
      .filter((row) => row.section_id === section.id)
      .map((row, index) => {
        const key = `custom_${row.id}`;
        const override = overrides[key];
        const item: ManagerQuestion = {
          id: key,
          kind: "personalizada",
          customId: row.id,
          text: row.text,
          type: row.type,
          required: row.required,
          sensitive: row.sensitive,
          active: row.active,
          removed: false,
          locked: false,
          gender: row.gender,
          dependents: 0,
        };
        return { item, order: override?.sortOrder ?? 1000 + row.sort_order, index: 1000 + index };
      });

    const questions = [...standard, ...custom].sort((a, b) => a.order - b.order || a.index - b.index).map((entry) => entry.item);
    return { id: section.id, title: section.title, gender: sectionGender, questions };
  });

  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-widest text-[#8c744f]">Administração</p>
      <h1 className="mt-2 text-3xl font-semibold">Perguntas do questionário</h1>
      <p className="mt-2 mb-7 max-w-3xl text-slate-600">
        Adicione, reordene, ative/desative ou remova perguntas de qualquer seção. As mudanças valem para os próximos pacientes que abrirem o questionário.
        Respostas já enviadas não são alteradas. Perguntas marcadas como <strong>Essenciais</strong> (identificação e alerta de segurança emocional) só podem ser reordenadas.
      </p>
      <QuestionManager sections={sections} />
    </div>
  );
}