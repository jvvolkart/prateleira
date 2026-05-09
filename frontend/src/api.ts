export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export type AuthUser = {
  id: string;
  email: string;
  role: "admin" | "user";
  company_id: string;
};

export async function loginJson(body: {
  email: string;
  password: string;
}): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    token?: string;
    user?: AuthUser;
  };
  if (!res.ok) {
    throw new Error(data.error ?? `login failed (${res.status})`);
  }
  if (!data.token || !data.user) {
    throw new Error("invalid response");
  }
  return { token: data.token, user: data.user };
}

export async function registerJson(body: {
  email: string;
  password: string;
  company_name: string;
}): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    token?: string;
    user?: AuthUser;
  };
  if (!res.ok) {
    throw new Error(data.error ?? `register failed (${res.status})`);
  }
  if (!data.token || !data.user) {
    throw new Error("invalid response");
  }
  return { token: data.token, user: data.user };
}

export async function fetchMe(token: string): Promise<{ user: AuthUser }> {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    user?: AuthUser;
  };
  if (!res.ok) {
    throw new Error(data.error ?? "session invalid");
  }
  if (!data.user) {
    throw new Error("invalid response");
  }
  return { user: data.user };
}

export type Product = {
  _id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  imageUrl: string;
};

export async function fetchProducts(token: string): Promise<Product[]> {
  const res = await fetch(`${API_URL}/products`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    products?: Product[];
  };
  if (!res.ok) {
    throw new Error(data.error ?? `products (${res.status})`);
  }
  const list = data.products ?? [];
  return list.map((p) => ({
    ...p,
    category: typeof p.category === "string" ? p.category : "",
  }));
}

/** Admin-only: POST /products (JSON or multipart with field `image`). */
export async function createProduct(
  token: string,
  input: {
    name: string;
    category?: string;
    description?: string;
    price: number;
    image?: File | null;
  }
): Promise<Product> {
  const headers: HeadersInit = { Authorization: `Bearer ${token}` };
  let body: BodyInit;

  if (input.image && input.image.size > 0) {
    const fd = new FormData();
    fd.append("name", input.name.trim());
    fd.append("category", input.category ?? "");
    fd.append("description", input.description ?? "");
    fd.append("price", String(input.price));
    fd.append("image", input.image);
    body = fd;
  } else {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify({
      name: input.name.trim(),
      category: input.category ?? "",
      description: input.description ?? "",
      price: input.price,
    });
  }

  const res = await fetch(`${API_URL}/products`, {
    method: "POST",
    headers,
    body,
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    product?: Product;
  };
  if (!res.ok) {
    throw new Error(data.error ?? `create product (${res.status})`);
  }
  if (!data.product) {
    throw new Error("invalid response");
  }
  const pr = data.product;
  return { ...pr, category: typeof pr.category === "string" ? pr.category : "" };
}

/** Admin-only: PATCH /products/:id */
export async function updateProduct(
  token: string,
  id: string,
  input: {
    name: string;
    category: string;
    description: string;
    price: number;
    image?: File | null;
  }
): Promise<Product> {
  const url = `${API_URL}/products/${encodeURIComponent(id)}`;

  if (input.image && input.image.size > 0) {
    const fd = new FormData();
    fd.append("name", input.name.trim());
    fd.append("category", input.category);
    fd.append("description", input.description);
    fd.append("price", String(input.price));
    fd.append("image", input.image);
    const res = await fetch(url, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      product?: Product;
    };
    if (!res.ok) {
      throw new Error(data.error ?? `update product (${res.status})`);
    }
    if (!data.product) {
      throw new Error("invalid response");
    }
    const pr = data.product;
    return { ...pr, category: typeof pr.category === "string" ? pr.category : "" };
  }

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: input.name.trim(),
      category: input.category,
      description: input.description,
      price: input.price,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    product?: Product;
  };
  if (!res.ok) {
    throw new Error(data.error ?? `update product (${res.status})`);
  }
  if (!data.product) {
    throw new Error("invalid response");
  }
  const pr = data.product;
  return { ...pr, category: typeof pr.category === "string" ? pr.category : "" };
}

/** Admin-only: DELETE /products/:id */
export async function deleteProduct(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_URL}/products/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 204) {
    return;
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  throw new Error(data.error ?? `delete (${res.status})`);
}

/** One turn for POST /chat (must match backend normalizeMessages). */
export type ChatRequestMessage = { role: "user" | "assistant"; content: string };

/** POST /chat with SSE; parses `data: {...}` lines */
export async function chatStream(
  token: string,
  messages: ChatRequestMessage[],
  onDelta: (text: string) => void,
  onDone: () => void,
  onError: (msg: string) => void
): Promise<void> {
  const res = await fetch(`${API_URL}/chat?stream=1`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    onError(text || res.statusText || "request failed");
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        let payload: unknown;
        try {
          payload = JSON.parse(line.slice(6));
        } catch {
          continue;
        }
        if (!payload || typeof payload !== "object") continue;
        const o = payload as { type?: string; text?: string; error?: string };
        if (o.type === "delta" && typeof o.text === "string") {
          onDelta(o.text);
        }
        if (o.type === "done") {
          onDone();
        }
        if (o.type === "error" && typeof o.error === "string") {
          onError(o.error);
          return;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
