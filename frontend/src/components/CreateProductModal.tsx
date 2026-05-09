import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import { ImageLightbox } from "./ImageLightbox";

export type ProductFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  busy: boolean;
  formError: string | null;
  formName: string;
  formCategory: string;
  formDescription: string;
  formPrice: string;
  formImage: File | null;
  /** Modo edição: URL absoluta da imagem atual (para preview quando não há arquivo novo). */
  existingImagePreviewUrl?: string | null;
  onClose: () => void;
  onFormName: (v: string) => void;
  onFormCategory: (v: string) => void;
  onFormDescription: (v: string) => void;
  onFormPrice: (v: string) => void;
  onFormImage: (f: File | null) => void;
  onSubmit: (e: FormEvent) => void;
};

export function ProductFormModal({
  open,
  mode,
  busy,
  formError,
  formName,
  formCategory,
  formDescription,
  formPrice,
  formImage,
  existingImagePreviewUrl = null,
  onClose,
  onFormName,
  onFormCategory,
  onFormDescription,
  onFormPrice,
  onFormImage,
  onSubmit,
}: ProductFormModalProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const fileId = useId();
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const onCloseRef = useRef(onClose);
  const busyRef = useRef(busy);
  onCloseRef.current = onClose;
  busyRef.current = busy;

  useEffect(() => {
    if (!open) setLightboxSrc(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busyRef.current) onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => closeRef.current?.focus(), 0);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [open]);

  if (!open) return null;

  const isEdit = mode === "edit";
  const title = isEdit ? "Editar produto" : "Novo produto";
  const subtitle = isEdit
    ? "Altere os dados do item na prateleira."
    : "Inclua um item na prateleira.";
  const imageLabel = isEdit ? "Nova imagem (opcional)" : "Imagem (opcional)";
  const submitLabel = busy ? "Salvando…" : isEdit ? "Salvar alterações" : "Cadastrar";
  const showCurrentImage = isEdit && existingImagePreviewUrl && !formImage;

  return (
    <>
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Fechar"
        disabled={busy}
        className="absolute inset-0 bg-zinc-900/40 backdrop-blur-[1px] dark:bg-black/70"
        onClick={() => {
          if (!busy) onClose();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 max-h-[min(96vh,52rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-zinc-100 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-zinc-900 dark:text-cream">
              {title}
            </h2>
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-cream/55">{subtitle}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            disabled={busy}
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 disabled:opacity-50 dark:text-cream/60 dark:hover:bg-zinc-800 dark:hover:text-cream"
            aria-label="Fechar"
          >
            <span className="text-xl leading-none" aria-hidden>
              ×
            </span>
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4 p-5 sm:p-6" aria-busy={busy}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-zinc-600 dark:text-cream/75">Nome</span>
              <input
                required
                value={formName}
                onChange={(e) => onFormName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-clinic-500/50 focus:ring-2 focus:ring-clinic-500/40 dark:border-zinc-700 dark:bg-black dark:text-cream"
              />
            </label>
            <label className="block text-sm">
              <span className="text-zinc-600 dark:text-cream/75">Preço (R$)</span>
              <input
                required
                type="number"
                min={0}
                step="0.01"
                value={formPrice}
                onChange={(e) => onFormPrice(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 tabular-nums text-zinc-900 focus:border-clinic-500/50 focus:ring-2 focus:ring-clinic-500/40 dark:border-zinc-700 dark:bg-black dark:text-cream"
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="text-zinc-600 dark:text-cream/75">Categoria (opcional)</span>
            <input
              value={formCategory}
              onChange={(e) => onFormCategory(e.target.value)}
              placeholder="Ex.: Serviços, Suplementos"
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-400 focus:border-clinic-500/50 focus:ring-2 focus:ring-clinic-500/40 dark:border-zinc-700 dark:bg-black dark:text-cream dark:placeholder:text-cream/35"
            />
          </label>
          <label className="block text-sm">
            <span className="text-zinc-600 dark:text-cream/75">Descrição</span>
            <textarea
              rows={3}
              value={formDescription}
              onChange={(e) => onFormDescription(e.target.value)}
              className="mt-1 w-full resize-none rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-clinic-500/50 focus:ring-2 focus:ring-clinic-500/40 dark:border-zinc-700 dark:bg-black dark:text-cream"
            />
          </label>
          {showCurrentImage && (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
              <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-cream/55">
                Imagem atual
              </p>
              <button
                type="button"
                onClick={() => setLightboxSrc(existingImagePreviewUrl)}
                className="group block w-full overflow-hidden rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-clinic-500"
                aria-label="Ver imagem em tela cheia"
              >
                <img
                  src={existingImagePreviewUrl}
                  alt=""
                  className="max-h-32 w-full cursor-zoom-in object-cover object-center transition-opacity group-hover:opacity-90"
                />
              </button>
            </div>
          )}
          <label className="block text-sm">
            <span className="text-zinc-600 dark:text-cream/75">{imageLabel}</span>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <input
                id={fileId}
                type="file"
                accept="image/*"
                onChange={(e) => onFormImage(e.target.files?.[0] ?? null)}
                className="sr-only"
              />
              <label
                htmlFor={fileId}
                className="inline-flex cursor-pointer items-center rounded-lg bg-clinic-500 px-3 py-1.5 text-sm font-medium text-black transition-colors hover:bg-clinic-400"
              >
                Selecionar imagem
              </label>
              <span className="text-sm text-zinc-500 dark:text-cream/60">
                {formImage ? formImage.name : "Nenhum arquivo escolhido"}
              </span>
            </div>
          </label>
          {formError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
              {formError}
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800/80">
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-cream dark:hover:bg-zinc-900"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-clinic-500 px-5 py-2 text-sm font-semibold text-black transition-colors hover:bg-clinic-400 disabled:opacity-50"
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
    <ImageLightbox
      src={lightboxSrc}
      open={lightboxSrc !== null}
      onClose={() => setLightboxSrc(null)}
    />
    </>
  );
}
