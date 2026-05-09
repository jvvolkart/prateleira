import { resolvePublicAssetUrl } from "../lib/public-url";
import { Product } from "../models";

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** PT stopwords — removed so short queries still match meaningful terms */
const STOP = new Set([
  "de",
  "da",
  "do",
  "das",
  "dos",
  "e",
  "em",
  "na",
  "no",
  "nas",
  "nos",
  "a",
  "o",
  "os",
  "as",
  "um",
  "uma",
  "uns",
  "umas",
  "para",
  "por",
  "com",
  "sem",
  "que",
  "se",
  "você",
  "voce",
  "vocês",
  "voces",
  "tem",
  "têm",
  "há",
  "ser",
  "são",
  "sobre",
  "como",
  "faz",
  "fazem",
  "isso",
  "algo",
  "algum",
  "alguma",
  "meu",
  "minha",
  "seu",
  "sua",
]);

function tokenize(raw: string): string[] {
  const parts = raw
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !STOP.has(t));
  return [...new Set(parts)];
}

function wordRegex(token: string): RegExp {
  return new RegExp(escapeRegex(token), "i");
}

function buildAndTokenFilter(
  company_id: unknown,
  tokens: string[]
): Record<string, unknown> {
  return {
    company_id,
    $and: tokens.map((t) => ({
      $or: [
        { name: wordRegex(t) },
        { description: wordRegex(t) },
        { category: wordRegex(t) },
      ],
    })),
  };
}

function buildOrTokenFilter(
  company_id: unknown,
  tokens: string[]
): Record<string, unknown> {
  return {
    company_id,
    $or: tokens.flatMap((t) => [
      { name: wordRegex(t) },
      { description: wordRegex(t) },
      { category: wordRegex(t) },
    ]),
  };
}

function mapProductRow(p: {
  _id: unknown;
  name: string;
  category?: string;
  description?: string;
  price: number;
  imageUrl?: string;
}): {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  imageUrl: string;
} {
  return {
    id: String(p._id),
    name: p.name,
    category: p.category ?? "",
    description: p.description ?? "",
    price: p.price,
    imageUrl: resolvePublicAssetUrl(p.imageUrl ?? ""),
  };
}

function buildPhraseFilter(
  company_id: unknown,
  phrase: string
): Record<string, unknown> {
  const q = escapeRegex(phrase.trim());
  const re = new RegExp(q, "i");
  return {
    company_id,
    $or: [{ name: re }, { description: re }, { category: re }],
  };
}

/** Always scoped to company_id from the authenticated tenant (never from tool args). */
export async function searchProducts(
  company_id: string,
  query: string | undefined,
  limit: number
): Promise<
  Array<{
    id: string;
    name: string;
    category: string;
    description: string;
    price: number;
    imageUrl: string;
  }>
> {
  const lim = Math.min(Math.max(Math.floor(limit) || 10, 1), 50);
  const trimmed = query?.trim() ?? "";

  let filter: Record<string, unknown> = { company_id };

  if (!trimmed) {
    const docs = await Product.find(filter).sort({ name: 1 }).limit(lim).lean();
    return docs.map((p) => mapProductRow(p));
  }

  const tokens = tokenize(trimmed);

  if (tokens.length === 0) {
    filter = buildPhraseFilter(company_id, trimmed);
  } else if (tokens.length === 1) {
    filter = buildOrTokenFilter(company_id, tokens);
  } else {
    filter = buildAndTokenFilter(company_id, tokens);
  }

  let docs = await Product.find(filter).sort({ name: 1 }).limit(lim).lean();

  if (docs.length === 0 && tokens.length === 0) {
    docs = await Product.find({ company_id }).sort({ name: 1 }).limit(lim).lean();
  }

  if (docs.length === 0 && tokens.length > 1) {
    filter = buildOrTokenFilter(company_id, tokens);
    docs = await Product.find(filter).sort({ name: 1 }).limit(lim).lean();
  }

  if (docs.length === 0 && trimmed) {
    filter = buildPhraseFilter(company_id, trimmed);
    docs = await Product.find(filter).sort({ name: 1 }).limit(lim).lean();
  }

  return docs.map((p) => mapProductRow(p));
}
