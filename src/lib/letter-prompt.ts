/** Prompt da carta para a pessoa próxima da paciente (marido, esposa, filha...). A médica revisa os campos e cola o texto no Claude. */

export type LetterKey =
  | "nome_paciente" | "idade" | "sexo"
  | "nome_destinatario" | "vinculo"
  | "tempo_sintomas" | "sintomas" | "frases_paciente" | "nota_impacto" | "areas_afetadas" | "tentativas_anteriores" | "objetivo_paciente"
  | "duracao_meses" | "equipe" | "qtd_parcelas" | "valor_parcela" | "contato" | "uf_crm";

export type LetterValues = Record<LetterKey, string>;

export const DEFAULT_LETTER_TEAM = "Dra. Janifer, com consultas e conversa mensal; Dra. Claudia, nutrição; Tadeu, avaliação física; Dra. Renata, terapia e sono";

export const LETTER_TEMPLATE = `Você é redator de comunicação médica premium do Instituto Trizi. Escreva uma carta pessoal da Dra. Janifer Sewruk Trizi que a paciente vai entregar a uma pessoa próxima. O objetivo é ajudar essa pessoa a entender o que a paciente está vivendo, perceber o valor do Plano Trizi 360º e decidir junto com ela por iniciar o plano.

══ DADOS DESTA CARTA ══
Paciente
- Nome: {{nome_paciente}}
- Idade: {{idade}}
- Sexo: {{sexo}}

Destinatário
- Nome: {{nome_destinatario}}
- Vínculo com a paciente: {{vinculo}}

O que a paciente relatou (use só isto)
- Há quanto tempo sente: {{tempo_sintomas}}
- Sintomas e queixas: {{sintomas}}
- Frases dela, literais: {{frases_paciente}}
- Impacto no dia a dia (0 a 10): {{nota_impacto}}
- Áreas da vida afetadas: {{areas_afetadas}}
- O que já tentou antes e como foi: {{tentativas_anteriores}}
- O que quer conquistar: {{objetivo_paciente}}

Plano
- Duração: {{duracao_meses}} meses
- Profissionais incluídos: {{equipe}}
- Pagamento: {{qtd_parcelas}}x de {{valor_parcela}} sem juros no cartão, ou via PIX
- Contato para agendar: {{contato}}

Se algum dado vier vazio, ou marcado como (vazio), não invente. Escreva a carta sem ele. Se faltar nome, valor ou contato, use [campo].

══ COMO TRABALHAR OS RELATOS DA PACIENTE ══
Antes de escrever, analise os relatos e escolha 2 ou 3 pontos que mais vão tocar o destinatário. Use estes critérios:

1. O que afeta diretamente a vida a dois ou a família. Por exemplo, irritabilidade, falta de desejo, cansaço que impede programas juntos, isolamento social. Mostre como isso aparece no dia a dia dos dois, sem culpar ninguém.

2. As frases dela que revelam esforço e sofrimento silencioso, como "me cobro muito" ou "minha mente não para". Use-as para mostrar que ela não está acomodada. Ela está esgotada.

3. A frustração com tentativas anteriores. Use-a para explicar, com naturalidade, por que um olhar integrado é diferente: sintomas vistos isoladamente não mostram o todo.

4. O objetivo dela, nas palavras dela. Ele será o fio condutor da parte final da carta.

Depois:
- Traduza cada sintoma escolhido em uma cena concreta e reconhecível da rotina. Exemplos: acordar já cansada, não ter vontade de sair, perder a paciência por pouco.
- Conecte os pontos escolhidos a como cada área do plano vai trabalhar sobre eles. Fale do sono, da alimentação, dos hormônios e da saúde emocional como partes que conversam entre si.
- Desfaça a ideia de "frescura" ou "falta de força de vontade" com uma afirmação clara e respeitosa: o que ela sente é real e merece ser investigado.
- Termine mostrando o que muda para os dois quando ela recupera energia, sono, disposição e equilíbrio. Use sempre "buscamos" ou "vamos trabalhar para".
- Convide o destinatário a apoiar a decisão e a fazer parte do cuidado no dia a dia.

══ ESTRUTURA ══
1. Abertura acolhedora, dirigida ao destinatário pelo papel que ele tem na vida dela.
2. O que ela está vivendo, com as palavras dela entre aspas, e o peso disso na rotina e na relação.
3. Por que as tentativas anteriores não resolveram e o que muda num cuidado integrado.
4. Como o plano funciona: a equipe, a conversa mensal com a Dra. Janifer e 3 etapas ao longo da duração.
   - Etapa 1: investigar e entender.
   - Etapa 2: ajustar e construir rotina.
   - Etapa 3: consolidar e dar autonomia.
   Mencione também o cronograma mês a mês, sem inventar o que acontece em cada mês, e que as condutas são ajustadas conforme a evolução da paciente.
5. O que buscamos para ela e, por consequência, para os dois.
6. Convite para apoiar e decidir junto.
7. Investimento e próximo passo:
   - Informe apenas a parcela: "{{qtd_parcelas}} parcelas de {{valor_parcela}} sem juros no cartão, ou via PIX".
   - Nunca mencione o valor total.
   - Feche com o contato para agendar.
8. "Com carinho e respeito," e a assinatura.

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
- Não exponha nenhum dado clínico além dos fornecidos.
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