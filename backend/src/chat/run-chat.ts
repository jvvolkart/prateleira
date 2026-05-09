import OpenAI from "openai";
import type {
  ChatCompletionAssistantMessageParam,
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
  ChatCompletionTool,
} from "openai/resources/chat/completions";
import { searchProducts } from "./search-products";

type ToolCallAcc = { id: string; name: string; arguments: string };

function accumulateToolDeltas(
  acc: Map<number, ToolCallAcc>,
  deltas: Array<{ index: number; id?: string; function?: { name?: string; arguments?: string } }> | undefined
): void {
  if (!deltas?.length) return;
  for (const tc of deltas) {
    const i = tc.index;
    if (!acc.has(i)) {
      acc.set(i, { id: tc.id ?? "", name: "", arguments: "" });
    }
    const row = acc.get(i)!;
    if (tc.id) row.id = tc.id;
    if (tc.function?.name) row.name += tc.function.name;
    if (tc.function?.arguments) row.arguments += tc.function.arguments;
  }
}

function toolCallsFromAcc(acc: Map<number, ToolCallAcc>): ChatCompletionMessageToolCall[] {
  const sorted = [...acc.entries()].sort((a, b) => a[0] - b[0]);
  return sorted.map(([, t]) => ({
    id: t.id,
    type: "function" as const,
    function: { name: t.name, arguments: t.arguments },
  }));
}

const MAX_TOOL_ROUNDS = 8;
const LIST_ALL_DEFAULT_LIMIT = 50;

function getModel(): string {
  return process.env.OPENAI_MODEL || "gpt-4o-mini";
}

function tools(): ChatCompletionTool[] {
  return [
    {
      type: "function",
      function: {
        name: "list_all_products",
        description:
          "Obtém a lista real de produtos/serviços cadastrados (nome, category, descrição, preço no JSON). Ao responder ao utilizador, mencione sempre a categoria de cada item quando o campo category no JSON não estiver vazio. Obrigatório antes de: descrever o catálogo; dizer quantos produtos existem; citar o mais barato ou mais caro; responder perguntas vagas após uma busca falhar; ou quando categorias genéricas (suplementos, beleza) forem mencionadas. Prefira limit 50 para não omitir itens.",
        parameters: {
          type: "object",
          properties: {
            limit: {
              type: "integer",
              description: "Teto de itens (1–50). Padrão 50.",
            },
          },
        },
      },
    },
    {
      type: "function",
      function: {
        name: "search_products",
        description:
          "Busca por palavras no nome, descrição ou categoria. Cada resultado inclui o campo category no JSON; na resposta ao utilizador inclua a categoria quando preenchida. Use em perguntas específicas: \"vocês fazem planos nutricionais?\", nomes de serviços, \"hormonal\", categoria (ex.: Serviços), etc. Se o resultado parecer incompleto ou vazio e a pergunta for ampla, chame list_all_products também na mesma rodada ou na seguinte.",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Palavras-chave (ex.: nutrição plano, hormonal, estética).",
            },
            limit: {
              type: "integer",
              description: "Máximo de resultados (1–50). Padrão 15.",
            },
          },
        },
      },
    },
  ];
}

function clampLimit(n: number | undefined, fallback: number, max: number): number {
  const v = typeof n === "number" && Number.isFinite(n) ? Math.floor(n) : fallback;
  return Math.min(Math.max(v, 1), max);
}

function buildMessages(userMessages: ChatCompletionMessageParam[]): ChatCompletionMessageParam[] {
  return [
    {
      role: "system",
      content:
        "Você é o assistente de catálogo da plataforma Prateleira (multi-unidade: produtos e serviços por unidade). Português do Brasil. " +
        "Não inventes o nome da unidade do cliente; usa apenas o catálogo devolvido pelas ferramentas e o que o utilizador disser. " +
        "Não promovas outro produto ou marca concorrente. " +
        "O teu único papel é falar do catálogo (produtos/serviços, preços, descrições): não respondas conhecimento geral, código nem temas alheios — isso fica fora do escopo.\n" +
        "Você não agenda consultas, procedimentos nem retornos — só informa com base no catálogo. Não diga que a pessoa pode \"avisar para agendar\", \"marcar por aqui\", \"combinar horário\" ou equivalente. Ao finalizar, convide apenas a outra dúvida sobre produtos/serviços do catálogo, sem prometer contato ou marcação.\n\n" +
        "Regras de dados (obrigatórias):\n" +
        "- Toda afirmação sobre o que existe no catálogo, preços, quantidade de itens, item mais barato/caros ou categorias deve vir exclusivamente do JSON retornado por list_all_products ou search_products. Não invente listas nem categorias genéricas.\n" +
        "- Diga \"único produto\" / \"só temos um\" somente se o array \"products\" da ferramenta tiver exatamente um elemento.\n" +
        "- Para comparar preços ou garantir que nada foi esquecido, use list_all_products com limit 50.\n" +
        "- Se a conversa anterior contradizer os dados da ferramenta, corrija usando sempre o último resultado da ferramenta.\n" +
        "- Não invente SKUs, estoque nem promoções.\n" +
        "- Em imagens Markdown, use o campo imageUrl de cada produto exatamente como veio no JSON (URL completa), sem mudar domínio, host ou caminho.\n" +
        "- Cada item no JSON tem o campo \"category\" (texto livre; pode vir vazio). Sempre que apresentar um produto ao utilizador — em lista, resumo ou detalhe — inclua a categoria se o valor de \"category\" no JSON não for vazio ou só espaços (ex.: após o nome: \"Categoria: Serviços\", ou uma linha/bullet dedicada). Se \"category\" estiver vazio, não inventes categoria; podes omitir essa linha.\n" +
        "- Ao listar vários produtos, podes agrupar por \"category\" quando fizer sentido e todas as categorias vierem do JSON.",
    },
    ...userMessages,
  ];
}

async function executeToolCall(tc: ChatCompletionMessageToolCall, company_id: string): Promise<string> {
  if (tc.type !== "function") {
    return JSON.stringify({ error: "unsupported tool" });
  }
  const fn = tc.function;
  if (fn.name === "list_all_products") {
    let args: { limit?: number } = {};
    try {
      args = JSON.parse(fn.arguments || "{}") as typeof args;
    } catch {
      args = {};
    }
    const lim = clampLimit(args.limit, LIST_ALL_DEFAULT_LIMIT, 50);
    const products = await searchProducts(company_id, undefined, lim);
    return JSON.stringify({ products });
  }
  if (fn.name === "search_products") {
    let args: { query?: string; limit?: number } = {};
    try {
      args = JSON.parse(fn.arguments || "{}") as typeof args;
    } catch {
      args = {};
    }
    const lim = clampLimit(args.limit, 15, 50);
    const products = await searchProducts(company_id, args.query, lim);
    return JSON.stringify({ products });
  }
  return JSON.stringify({ error: "unknown tool" });
}

/**
 * Runs the tool loop; streams **final** assistant text tokens via OpenAI as they arrive.
 * Tool rounds (function calls) do not emit to the client.
 */
export async function runChatStreaming(
  userMessages: ChatCompletionMessageParam[],
  company_id: string,
  onTextDelta: (chunk: string) => void
): Promise<void> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  const openai = new OpenAI({ apiKey: key });
  const model = getModel();
  const messages = buildMessages(userMessages);

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const stream = await openai.chat.completions.create({
      model,
      messages,
      tools: tools(),
      tool_choice: round === 0 ? "required" : "auto",
      stream: true,
    });

    const toolAcc = new Map<number, ToolCallAcc>();
    let sawToolDelta = false;
    let assistantContent = "";

    for await (const chunk of stream) {
      const choice = chunk.choices[0];
      if (!choice) continue;
      const delta = choice.delta;
      if (delta.tool_calls?.length) {
        sawToolDelta = true;
        accumulateToolDeltas(toolAcc, delta.tool_calls);
      }
      if (delta.content) {
        assistantContent += delta.content;
        if (!sawToolDelta) {
          onTextDelta(delta.content);
        }
      }
    }

    if (toolAcc.size > 0) {
      const tool_calls = toolCallsFromAcc(toolAcc);
      const assistantMsg: ChatCompletionAssistantMessageParam = {
        role: "assistant",
        content: assistantContent.trim() || null,
        tool_calls,
      };
      messages.push(assistantMsg);

      for (const tc of tool_calls) {
        const payload = await executeToolCall(tc, company_id);
        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: payload,
        });
      }
      continue;
    }

    return;
  }

  throw new Error("tool loop limit exceeded");
}

/** Full reply string (no streaming to HTTP). Uses the same path as SSE. */
export async function runChat(
  userMessages: ChatCompletionMessageParam[],
  company_id: string
): Promise<string> {
  let out = "";
  await runChatStreaming(userMessages, company_id, (c) => {
    out += c;
  });
  return out;
}
