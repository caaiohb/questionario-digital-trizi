/** Prompt da carta para o marido da paciente. A médica informa só o nome dele e o valor do plano; o resto vem do questionário e das Configurações. */

export type LetterKey =
  | "nome_paciente" | "idade" | "sexo"
  | "nome_destinatario" | "vinculo"
  | "questionario"
  | "duracao_meses" | "equipe" | "qtd_parcelas" | "valor_parcela" | "contato" | "uf_crm";

export type LetterValues = Record<LetterKey, string>;

/** Dados fixos do plano, cadastrados uma vez pelo administrador em Configurações. */
export interface LetterPlan {
  duracao_meses: string;
  qtd_parcelas: string;
  contato: string;
  uf_crm: string;
  equipe: string;
}

export const DEFAULT_LETTER_TEAM = "Dra. Janifer, com consultas e conversa mensal; Dra. Claudia, nutrição; Tadeu, avaliação física; Dra. Renata, terapia e sono";

export const DEFAULT_LETTER_PLAN: LetterPlan = { duracao_meses: "", qtd_parcelas: "", contato: "", uf_crm: "", equipe: DEFAULT_LETTER_TEAM };

export const LETTER_TEMPLATE = `Você é redator de comunicação médica premium do Instituto Trizi. Escreva uma carta pessoal da Dra. Janifer Sewruk Trizi que a paciente vai entregar ao marido ou a uma pessoa próxima. O objetivo é ajudar essa pessoa a entender o que a paciente está vivendo, enxergar o que ela pode melhorar com o Plano Trizi 360º e decidir junto com ela por apoiar o plano.

══ DADOS DESTA CARTA ══
Paciente
- Nome: {{nome_paciente}}
- Idade: {{idade}}
- Sexo: {{sexo}}

Destinatário
- Nome: {{nome_destinatario}}
- Vínculo com a paciente: {{vinculo}}

Plano
- Duração: {{duracao_meses}} meses
- Profissionais incluídos: {{equipe}}
- Pagamento: {{qtd_parcelas}}x de {{valor_parcela}} sem juros no cartão, ou via PIX
- Contato para agendar: {{contato}}

Se algum dado vier vazio, ou marcado como (vazio), não invente. Escreva a carta sem ele. Se faltar nome, valor ou contato, use [campo].

══ QUESTIONÁRIO PREENCHIDO PELA PACIENTE ══
Use o questionário inteiro para analisar os gatilhos dela. As informações clínicas e íntimas servem para você entender o contexto e não devem ser citadas na carta.

{{questionario}}

══ ANÁLISE ANTES DE ESCREVER (não mostre esta análise) ══
Leia o questionário completo e escolha 2 ou 3 gatilhos que mais vão tocar o destinatário e ajudá-lo a apoiar o plano. Use estes critérios:

1. O que afeta diretamente a vida a dois ou a família. Por exemplo, irritabilidade, cansaço que impede programas juntos, sono ruim, isolamento social, falta de energia. Mostre como isso aparece no dia a dia dos dois, sem culpar ninguém.

2. As frases dela, escritas com as próprias palavras, que revelam esforço e sofrimento silencioso. Use-as para mostrar que ela não está acomodada. Ela está esgotada.

3. A frustração com tentativas anteriores e o que a impediu de se cuidar até hoje. Use-a para explicar, com naturalidade, por que um olhar integrado é diferente: sintomas vistos isoladamente não mostram o todo.

4. O objetivo dela para daqui a 6 meses, nas palavras dela. Ele será o fio condutor da parte final da carta.

5. O jeito dela de decidir sobre a própria saúde. Se ela costuma decidir junto com alguém, convide o destinatário a participar. Se decide sozinha, respeite a autonomia dela e peça o apoio dele.

Depois:
- Traduza cada gatilho escolhido em uma cena concreta e reconhecível da rotina. Exemplos: acordar já cansada, não ter vontade de sair, perder a paciência por pouco.
- Para cada gatilho, mostre o que buscamos melhorar para ela e como isso aparece no dia a dia dos dois. Conecte aos pilares do plano: sono, alimentação, hormônios e saúde emocional trabalhando juntos.
- Desfaça a ideia de "frescura" ou "falta de força de vontade" com uma afirmação clara e respeitosa: o que ela sente é real e merece ser investigado.
- Apresente o plano como um cuidado que o casal escolhe junto, em que o apoio dele faz diferença. Mostre o que ganham os dois quando ela recupera energia, sono, disposição e equilíbrio. Use sempre "buscamos" ou "vamos trabalhar para".
- Convide o destinatário a apoiar a decisão e a fazer parte do cuidado no dia a dia.

══ ESTRUTURA ══
1. Abertura acolhedora, começando com “Caro {{nome_destinatario}},” (use “Cara” se o destinatário for mulher e nunca use “Querido”), dirigida a ele pelo papel que tem na vida dela.
2. O que ela está vivendo, com as palavras dela entre aspas, e o peso disso na rotina e na relação.
3. Por que as tentativas anteriores não resolveram e o que muda num cuidado integrado.
4. Como o plano funciona: a equipe, a conversa mensal com a Dra. Janifer e 3 etapas ao longo da duração.
   - Etapa 1: investigar e entender.
   - Etapa 2: ajustar e construir rotina.
   - Etapa 3: consolidar e dar autonomia.
   Mencione também o cronograma mês a mês, sem inventar o que acontece em cada mês, e que as condutas são ajustadas conforme a evolução da paciente.
5. O que buscamos melhorar para ela e, por consequência, para os dois.
6. Convite para apoiar e decidir junto.
7. Investimento: informe apenas a parcela, "{{qtd_parcelas}} parcelas de {{valor_parcela}} sem juros no cartão, ou via PIX". Nunca mencione o valor total.
8. CTA final, logo depois do investimento. Um parágrafo curto, caloroso e inspirador, que encante o destinatário: o nosso objetivo é transformar a vida de {{nome_paciente}} para que ela volte a ter uma vida maravilhosa ao lado da família. Convide-o a dar esse passo junto com ela e feche com o contato para agendar. Sem pressão, sem urgência e sem prometer resultado.
9. "Com carinho e respeito," e a assinatura.

══ TOM ══
- Carta pessoal de uma médica de referência, nunca um anúncio. Primeira pessoa ("eu", "comigo").
- Elegante, calorosa e segura. Frases curtas, sem jargão técnico.
- Sem emojis, sem caixa alta, sem listas no corpo da carta.
- Entre 320 e 370 palavras, para caber em 1 página A4.
- Concordância de gênero conforme o sexo da paciente e o vínculo do destinatário.
- Varie a redação a cada carta. Não repita frases-padrão entre pacientes.

══ REGRAS OBRIGATÓRIAS (Resolução CFM nº 2.336/2023) ══
- Não prometa cura, prazo nem resultado garantido.
- Não use pressão, urgência, escassez, culpa ou medo. Nada de "não deixe para depois" ou "antes que piore".
- A persuasão vem apenas de compreensão, empatia e clareza sobre o cuidado.
- Não fale em diagnóstico. Fale em investigação e cuidado.
- Não cite morte, doenças graves nem riscos.
- Não cite exames, medicamentos nem hormônios específicos.
- Não cite condições de saúde, histórico familiar, vida íntima nem qualquer dado clínico do questionário. Cite apenas o que ela relatou como incômodo no dia a dia, como cansaço, sono, humor e disposição.
- Use somente o que consta no questionário. Não invente dados.
- Não use depoimentos, comparações com outros profissionais nem "antes e depois".
- Não sugira que o Instituto vá contatar o destinatário diretamente.

══ ASSINATURA (fixa) ══
Dra. Janifer Sewruk Trizi
Médica · CRM {{uf_crm}} 112.184
Instituto Trizi

══ FORMATO DE SAÍDA ══
Responda somente com a carta, sem comentários antes ou depois, em HTML simples:
- <h1> com um título curto e delicado, diferente a cada carta, sem o nome da paciente.
- Cada parágrafo em <p>.
- Citações da paciente entre aspas curvas “ ” dentro de <q>.
- A frase sobre "o que ela sente é real" em <p class="destaque">.
- A assinatura em <div class="assinatura">.`;

/** Lê um valor em reais digitado do jeito brasileiro ("12.000,00", "R$ 12000", "990"). Devolve null se não for um número válido. */
export function parseMoney(input: string): number | null {
  let text = input.replace(/R\$|\s/g, "");
  if (!text) return null;
  if (text.includes(",")) text = text.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(text)) text = text.replace(/\./g, "");
  const value = Number(text);
  return Number.isFinite(value) && value > 0 ? value : null;
}

/** Valor de cada parcela em reais (ex.: "R$ 1.200,00"), a partir do valor do plano e da quantidade de parcelas. Null se algum dado for inválido. */
export function installmentValue(total: string, installments: string): string | null {
  const amount = parseMoney(total);
  const count = Number.parseInt(installments.trim(), 10);
  if (amount === null || !Number.isInteger(count) || count < 1 || count > 60) return null;
  const each = Math.round((amount / count) * 100) / 100;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(each).replace(/\u00a0/g, " ");
}

/** Troca cada {{campo}} pelo valor preenchido; campo em branco vira "(vazio)". */
export function renderLetterPrompt(values: Partial<LetterValues>): string {
  return LETTER_TEMPLATE.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = (values as Record<string, string | undefined>)[key];
    const text = typeof value === "string" ? value.trim() : "";
    return text || "(vazio)";
  });
}