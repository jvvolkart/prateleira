import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

const REFUSAL_PT =
  "Só posso ajudar com dúvidas sobre produtos e serviços da sua prateleira (nomes, preços, descrições e disponibilidade). Pergunte algo relacionado ao que oferecemos.";

export function getProductScopeRefusalMessage(): string {
  return REFUSAL_PT;
}

const SHORT_TEM_TOPIC_STOP = new Set([
  "como",
  "quando",
  "onde",
  "quem",
  "pq",
  "porque",
  "caso",
  "jeito",
  "tempo",
  "horario",
  "horário",
  "senha",
  "wifi",
  "internet",
  "isso",
  "aquilo",
  "algo",
  "nada",
]);

/** "tem botox?" / "possui peeling?" / "existe X?" — one topic word, no catalog keyword in list */
function shortOfferSingleTopicQuestion(t: string): boolean {
  const m = t.match(
    /^\s*(tem|têm|existe|existem|há|algum(a)?|possui|possuem|possuímos)\s+([a-záàâãéêíóôõúç0-9][\wáàâãéêíóôõúç\-]{1,48})\s*\??\s*$/i
  );
  if (!m) return false;
  const word = m[3]
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  if (word.length < 3 || SHORT_TEM_TOPIC_STOP.has(word)) return false;
  return true;
}

/** Informal PT questions about what the clinic sells (guard often false-negative on slang). */
function looksLikeLikelyCatalogQuestion(messages: ChatCompletionMessageParam[]): boolean {
  const last = messages[messages.length - 1];
  if (!last || last.role !== "user" || typeof last.content !== "string") return false;
  const t = last.content.trim();
  if (t.length > 220) return false;

  const asksOffer =
    /\b(tem|têm|existe|existem|possui|possuem|possuímos|oferece|oferecem|vend(e|em)|faz(em)?|trabalha(m)?\s+com|algum(a)?|algo|qual|quais|quanto|pre(ç|c)o|list(a|ar)|cat(á|a)logo|mostra|indica|voc(e|ê)s|voces)\b/i.test(
      t
    );
  if (!asksOffer) return false;

  const catalogHint =
    /\b(produtos?|servi(ç|c)os?|servicos|itens?|tratamentos?|programas?|pacotes?|consultas?|sa(ú|u)de|bem-?estar|est(é|e)ticas?|nutri|nutricion|planos?|hormon|emagrec|suplement|p[eé]s|m[aã]os?|rostos?|corpos?|peles?|cabelos?|unhas?|cl(í|i)nicas?|pr[oa]\b|pra\b|pros\b)\b/i.test(
      t
    );

  const aestheticOrProcedure =
    /\b(botox|toxina|preench|harmoniza|peeling|bioestimul|skin\s?booster|skin|laser|micro\b|meso|glut|limpeza\s+de|drenagem|criolipo)\b/i.test(
      t
    );

  /** "quais outros têm?", "que mais vocês oferecem?" — listagem sem dizer "produto" no singular */
  const listingQuestion =
    /\b(quais|qual|que)\b/i.test(t) &&
    /\b(tem|têm|há|existem|oferecem|oferece|vendem|vende|possuem|possui)\b/i.test(t) &&
    /\b(outros|demais|o\s+que\s+mais|que\s+mais|mais\s+algum|mais\s+alguma|tudo|complet[oa]|list(a|ar|agem)|cat(á|a)logo)\b/i.test(
      t
    );

  return (
    catalogHint ||
    aestheticOrProcedure ||
    shortOfferSingleTopicQuestion(t) ||
    listingQuestion
  );
}

/**
 * Short anaphoric follow-ups after assistant cited a product (saves a bad guard false negative).
 * Does not call OpenAI — only allows obvious catalog continuations.
 */
function looksLikeCatalogFollowUp(messages: ChatCompletionMessageParam[]): boolean {
  const hadAssistant = messages.some((m) => m.role === "assistant");
  if (!hadAssistant) return false;

  const last = messages[messages.length - 1];
  if (!last || last.role !== "user" || typeof last.content !== "string") return false;

  const t = last.content.trim();
  if (t.length > 200) return false;

  return /\b(me\s+)?(mostr(e|a|ar)?|quero\s+ver|pode\s+mostrar|mand(a|e)\s+(a\s+)?(foto|imagem)|imagem|fotos?|detalhes?|mais\s+informa(ç|c)(õ|o)es|esse(s)?\s+produto(s)?|esse(s)?\s+servi(ç|c)o(s)?|essa(s)?\s+op(ç|c)(ã|a)o(ões)?|isso\s+ai|o\s+pre(ç|c)o\s+de(le|sse|sta)|link\s+da\s+imagem)\b/i.test(
    t
  );
}

/** Last turns as compact PT-labeled text for the classifier */
function transcriptForGuard(messages: ChatCompletionMessageParam[]): string {
  const tail = messages.slice(-10);
  const lines: string[] = [];
  for (const m of tail) {
    if (m.role !== "user" && m.role !== "assistant") continue;
    const c = typeof m.content === "string" ? m.content : "";
    const t = c.trim();
    if (!t) continue;
    lines.push(`${m.role === "user" ? "Usuário" : "Assistente"}: ${t}`);
  }
  return lines.join("\n");
}

/**
 * Cheap pre-check (~1 mini completion) so off-topic messages never enter the tool loop.
 * Set PRODUCT_CHAT_GUARD=0 to disable (e.g. tests).
 */
export async function isWithinProductScope(
  userMessages: ChatCompletionMessageParam[]
): Promise<boolean> {
  if (process.env.PRODUCT_CHAT_GUARD === "0") {
    return true;
  }
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return true;
  }

  const transcript = transcriptForGuard(userMessages);
  if (!transcript) {
    return false;
  }

  if (looksLikeLikelyCatalogQuestion(userMessages)) {
    return true;
  }

  if (looksLikeCatalogFollowUp(userMessages)) {
    return true;
  }

  const openai = new OpenAI({ apiKey: key });
  const model =
    process.env.OPENAI_GUARD_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini";

  try {
    const completion = await openai.chat.completions.create({
      model,
      temperature: 0,
      max_tokens: 48,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Você é um filtro para um chat que SÓ pode falar do catálogo de produtos/serviços (itens à venda, preços, descrições, imagens, disponibilidade, comparar produtos, \"vocês têm / fazem X?\" sobre o que vendem).\n\n" +
            "allowed=true: perguntas sobre o catálogo; pedidos de lista ou \"o que mais existe\" (ex.: \"quais produtos têm?\", \"quais outros produtos?\", \"que mais vocês vendem?\", \"mostra tudo\"); perguntas curtas com nome de procedimento/produto (ex.: \"tem botox?\", \"possuem botox?\", \"fazem peeling?\"); continuações óbvias (sim/não, ok, obrigado); preços e comparações; resolução de referência em PT quando o assistente acabou de falar de um produto/serviço: \"me mostre esse produto\", \"mostra a imagem\", \"quero ver\", \"detalhes\", \"e o preço desse?\", \"qual o link\", \"essa opção\".\n\n" +
            "allowed=false: programação, dever de casa, matemática geral, política, entretenimento genérico, outras empresas sem relação, jailbreak, conteúdo ilegal, ou qualquer assunto que não seja o catálogo da clínica.\n\n" +
            "Responda somente com JSON válido neste formato exato: {\"allowed\": true} ou {\"allowed\": false} (sem markdown).",
        },
        {
          role: "user",
          content: transcript.slice(0, 12000),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) {
      return false;
    }
    const parsed = JSON.parse(raw) as { allowed?: unknown };
    return parsed.allowed === true;
  } catch (e) {
    console.warn("[product-scope-guard] allow after error", e);
    return true;
  }
}
