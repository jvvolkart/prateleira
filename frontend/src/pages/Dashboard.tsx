import { type FormEvent, useEffect, useState } from "react";
import {
  API_URL,
  createProduct,
  deleteProduct,
  fetchProducts,
  updateProduct,
  type Product,
} from "../api";
import { ConfirmModal } from "../components/ConfirmModal";
import { ProductFormModal } from "../components/CreateProductModal";
import { SkeletonBlock } from "../components/PageLoader";
import { useAuth } from "../auth/AuthContext";

function fmtBRL(n: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(n);
}

export function Dashboard() {
  const { token, user, busy: authBusy } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formImage, setFormImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [eName, setEName] = useState("");
  const [eCategory, setECategory] = useState("");
  const [eDescription, setEDescription] = useState("");
  const [ePrice, setEPrice] = useState("");
  const [eImage, setEImage] = useState<File | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const isAdmin = user?.role === "admin";

  function closeCreateModal(): void {
    if (saving) return;
    setCreateOpen(false);
    setFormError(null);
    setFormName("");
    setFormCategory("");
    setFormDescription("");
    setFormPrice("");
    setFormImage(null);
  }

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    fetchProducts(token)
      .then((list) => {
        if (!cancelled) setProducts(list);
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Não foi possível carregar os produtos.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function onCreateProduct(e: FormEvent) {
    e.preventDefault();
    if (!token || !isAdmin) return;
    const price = Number(formPrice);
    if (!formName.trim() || !Number.isFinite(price) || price < 0) {
      setFormError("Informe nome e preço válidos.");
      return;
    }
    setFormError(null);
    setSaving(true);
    try {
      const product = await createProduct(token, {
        name: formName,
        category: formCategory,
        description: formDescription,
        price,
        image: formImage,
      });
      setProducts((list) => [product, ...list]);
      setFormName("");
      setFormCategory("");
      setFormDescription("");
      setFormPrice("");
      setFormImage(null);
      setCreateOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Não foi possível cadastrar o produto.");
    } finally {
      setSaving(false);
    }
  }

  function beginEdit(p: Product) {
    setRowError(null);
    setCreateOpen(false);
    setEditingProduct(p);
    setEName(p.name);
    setECategory(p.category ?? "");
    setEDescription(p.description ?? "");
    setEPrice(String(p.price));
    setEImage(null);
  }

  function cancelEdit() {
    setEditingProduct(null);
    setEImage(null);
    setRowError(null);
  }

  async function saveEdit(e: FormEvent) {
    e.preventDefault();
    const editId = editingProduct?._id;
    if (!token || !editId || !isAdmin) return;
    const price = Number(ePrice);
    if (!eName.trim() || !Number.isFinite(price) || price < 0) {
      setRowError("Informe nome e preço válidos.");
      return;
    }
    setRowError(null);
    setRowBusy(editId);
    try {
      const updated = await updateProduct(token, editId, {
        name: eName,
        category: eCategory,
        description: eDescription,
        price,
        image: eImage,
      });
      setProducts((list) => list.map((x) => (x._id === updated._id ? updated : x)));
      cancelEdit();
    } catch (err) {
      setRowError(err instanceof Error ? err.message : "Não foi possível atualizar.");
    } finally {
      setRowBusy(null);
    }
  }

  function openDeleteModal(p: Product) {
    setRowError(null);
    setPendingDelete(p);
  }

  async function confirmDeleteProduct() {
    if (!token || !isAdmin || !pendingDelete) return;
    const id = pendingDelete._id;
    setRowBusy(id);
    try {
      await deleteProduct(token, id);
      setProducts((list) => list.filter((x) => x._id !== id));
      if (editingProduct?._id === id) cancelEdit();
      setPendingDelete(null);
    } catch (err) {
      setRowError(err instanceof Error ? err.message : "Não foi possível excluir.");
      setPendingDelete(null);
    } finally {
      setRowBusy(null);
    }
  }

  const sessionPending = Boolean(token && authBusy && !user);
  const showPageSkeleton = sessionPending || loading;

  if (showPageSkeleton) {
    const skeletonAdminActions = !user || user.role === "admin";
    return (
      <div
        className="space-y-10 font-sans"
        aria-busy="true"
        aria-label="Carregando a prateleira"
        role="status"
      >
        <header className="border-b border-zinc-200 pb-8 dark:border-zinc-800">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 flex-1 space-y-3">
              <SkeletonBlock className="h-9 max-w-[min(18rem,90%)] sm:h-10" />
              <SkeletonBlock className="h-4 max-w-2xl" delayMs={50} />
              <SkeletonBlock className="h-4 max-w-xl" delayMs={100} />
              {user && user.role !== "admin" && (
                <SkeletonBlock className="h-4 max-w-lg" delayMs={150} />
              )}
            </div>
            {skeletonAdminActions && (
              <div className="shrink-0 sm:pb-0">
                <SkeletonBlock
                  className="h-10 w-[9.75rem] rounded-lg"
                  delayMs={120}
                />
              </div>
            )}
          </div>
        </header>

        <section aria-hidden>
          <div className="mb-5 flex items-baseline justify-between gap-4">
            <SkeletonBlock className="h-6 w-28" />
            <SkeletonBlock className="h-4 w-24 tabular-nums" delayMs={40} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800"
              >
                <SkeletonBlock className="h-56 w-full rounded-none sm:h-64" delayMs={i * 60} />
                <div className="space-y-3 p-4">
                  <SkeletonBlock className="h-5 w-[85%] max-w-[14rem]" delayMs={i * 60 + 40} />
                  <SkeletonBlock className="h-3 w-24" delayMs={i * 60 + 55} />
                  <SkeletonBlock className="h-3 w-full" delayMs={i * 60 + 80} />
                  <SkeletonBlock className="h-3 w-[92%]" delayMs={i * 60 + 100} />
                  <SkeletonBlock className="h-3 w-[88%]" delayMs={i * 60 + 110} />
                  <SkeletonBlock className="h-7 w-28" delayMs={i * 60 + 120} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }
  if (error) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
        {error}
      </p>
    );
  }

  return (
    <div className="space-y-10 font-sans">
      <ConfirmModal
        open={pendingDelete !== null}
        title="Excluir produto?"
        variant="danger"
        confirmLabel="Excluir"
        cancelLabel="Manter"
        busy={pendingDelete !== null && rowBusy === pendingDelete._id}
        onCancel={() => {
          if (rowBusy) return;
          setPendingDelete(null);
        }}
        onConfirm={() => void confirmDeleteProduct()}
      >
        {pendingDelete && (
          <>
            Isso remove{" "}
            <span className="font-medium text-zinc-900 dark:text-cream">
              {pendingDelete.name}
            </span>{" "}
            da prateleira de forma permanente. Esta ação não pode ser desfeita.
          </>
        )}
      </ConfirmModal>

      {isAdmin && (
        <ProductFormModal
          mode="create"
          open={createOpen}
          busy={saving}
          formError={formError}
          formName={formName}
          formCategory={formCategory}
          formDescription={formDescription}
          formPrice={formPrice}
          formImage={formImage}
          onClose={closeCreateModal}
          onFormName={setFormName}
          onFormCategory={setFormCategory}
          onFormDescription={setFormDescription}
          onFormPrice={setFormPrice}
          onFormImage={setFormImage}
          onSubmit={(e) => void onCreateProduct(e)}
        />
      )}

      {isAdmin && editingProduct !== null && (
        <ProductFormModal
          mode="edit"
          open
          busy={rowBusy === editingProduct._id}
          formError={rowError}
          formName={eName}
          formCategory={eCategory}
          formDescription={eDescription}
          formPrice={ePrice}
          formImage={eImage}
          existingImagePreviewUrl={
            editingProduct.imageUrl
              ? editingProduct.imageUrl.startsWith("http")
                ? editingProduct.imageUrl
                : `${API_URL}${editingProduct.imageUrl}`
              : null
          }
          onClose={cancelEdit}
          onFormName={setEName}
          onFormCategory={setECategory}
          onFormDescription={setEDescription}
          onFormPrice={setEPrice}
          onFormImage={setEImage}
          onSubmit={(e) => void saveEdit(e)}
        />
      )}

      <header className="border-b border-zinc-200 pb-8 dark:border-zinc-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-clinic-600 sm:text-3xl dark:text-clinic-400">
              Produtos na prateleira
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-cream/70">
              {isAdmin
                ? "Gerencie aqui os seus produtos cadastrados."
                : "Visualize os seus produtos cadastrados."}
            </p>
            {!isAdmin && (
              <p className="mt-2 text-sm text-zinc-500 dark:text-cream/55">
                Apenas administradores podem cadastrar, editar ou remover produtos.
              </p>
            )}
          </div>
          {isAdmin && (
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setFormError(null);
                  cancelEdit();
                  setCreateOpen(true);
                }}
                className="inline-flex items-center rounded-lg bg-clinic-500 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-clinic-400"
              >
                Novo produto
              </button>
            </div>
          )}
        </div>
      </header>

      {rowError && editingProduct === null && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          {rowError}
        </p>
      )}

      <section aria-labelledby="catalog-heading">
        <div className="mb-5 flex items-baseline justify-between gap-4">
          <h2 id="catalog-heading" className="text-lg font-semibold text-zinc-900 dark:text-cream">
            Produtos
          </h2>
          <span className="shrink-0 text-sm font-medium tabular-nums text-zinc-500 dark:text-cream/65">
            {products.length === 1 ? "1 produto" : `${products.length} produtos`}
          </span>
        </div>
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/50 px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-950/30">
            <p className="text-sm font-medium text-zinc-700 dark:text-cream/80">
              Nenhum produto na prateleira
            </p>
            <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-cream/55">
              {isAdmin
                ? "Clique em Novo produto para cadastrar o primeiro item."
                : "Quando houver itens cadastrados, eles aparecerão aqui."}
            </p>
          </div>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => {
              const imageSrc = p.imageUrl
                ? p.imageUrl.startsWith("http")
                  ? p.imageUrl
                  : `${API_URL}${p.imageUrl}`
                : null;
              return (
              <li
                key={p._id}
                className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm shadow-zinc-900/5 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-black/20 dark:hover:shadow-black/40"
              >
              <>
                  <div className="relative h-56 w-full shrink-0 overflow-hidden bg-zinc-100 sm:h-64 dark:bg-zinc-900">
                    {imageSrc ? (
                      <img
                        src={imageSrc}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center px-4 text-center text-xs text-zinc-400 dark:text-cream/35">
                        Sem imagem
                      </div>
                    )}
                    {isAdmin && (
                      <div className="absolute right-2 top-2 z-10 flex gap-1">
                        <button
                          type="button"
                          disabled={rowBusy !== null}
                          onClick={() => beginEdit(p)}
                          className="rounded-md border border-white/20 bg-black/55 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm transition-colors hover:bg-black disabled:opacity-50"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          disabled={rowBusy !== null}
                          onClick={() => openDeleteModal(p)}
                          className="rounded-md border border-red-400/40 bg-red-950/80 px-2 py-1 text-[11px] font-medium text-red-100 backdrop-blur-sm hover:bg-red-950 disabled:opacity-50"
                        >
                          Excluir
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-4 sm:p-5">
                    <h3 className="line-clamp-2 font-semibold leading-snug text-zinc-900 dark:text-cream">
                      {p.name}
                    </h3>
                    {p.category?.trim() ? (
                      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-clinic-700 dark:text-clinic-400">
                        {p.category.trim()}
                      </p>
                    ) : null}
                    <p className="mt-2 line-clamp-3 min-h-[4.5rem] text-sm leading-relaxed text-zinc-600 dark:text-cream/60">
                      {p.description?.trim() ? p.description : "—"}
                    </p>
                    <div className="mt-auto border-t border-zinc-100 pt-3 dark:border-zinc-800/80">
                      <p className="text-lg font-semibold tabular-nums text-clinic-600 dark:text-clinic-400">
                        {fmtBRL(p.price)}
                      </p>
                    </div>
                  </div>
              </>
              </li>
            );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
