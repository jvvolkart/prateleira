import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";

export type ConfirmModalProps = {
  open: boolean;
  title: string;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  open,
  title,
  children,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const titleId = useId();
  const descId = useId();
  const confirmRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) {
        onCancel();
      }
    };
    window.addEventListener("keydown", onKey);
    const primaryFocus =
      variant === "danger" ? cancelRef.current : confirmRef.current;
    const t = window.setTimeout(() => primaryFocus?.focus(), 0);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [open, busy, onCancel, variant]);

  if (!open) {
    return null;
  }

  const confirmClass =
    variant === "danger"
      ? "bg-red-700 text-white hover:bg-red-800 active:bg-red-900 disabled:opacity-50"
      : "bg-clinic-500 text-black hover:bg-clinic-400 disabled:opacity-50";

  return (
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
          if (!busy) onCancel();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={children ? descId : undefined}
        className="relative z-10 w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-xl shadow-zinc-200/50 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-black/50"
      >
        <h2
          id={titleId}
          className="text-lg font-semibold text-zinc-900 dark:text-cream"
        >
          {title}
        </h2>
        {children && (
          <div
            id={descId}
            className="mt-2 text-sm text-zinc-600 dark:text-cream/75"
          >
            {children}
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-cream dark:hover:bg-zinc-900"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${confirmClass}`}
          >
            {busy ? "…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
