import { useEffect } from "react";

export type ImageLightboxProps = {
  src: string | null;
  alt?: string;
  open: boolean;
  onClose: () => void;
};

export function ImageLightbox({ src, alt = "", open, onClose }: ImageLightboxProps) {
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey, true);
    };
  }, [open, onClose]);

  if (!open || !src) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label="Imagem em tela cheia"
    >
      <button
        type="button"
        aria-label="Fechar visualização"
        className="absolute inset-0 bg-black/88 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <img
        src={src}
        alt={alt}
        className="relative z-10 max-h-full max-w-full object-contain shadow-2xl"
      />
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute right-3 top-3 z-20 rounded-lg bg-white/15 px-3 py-1.5 text-2xl leading-none text-white backdrop-blur-sm transition-colors hover:bg-white/25"
      >
        <span aria-hidden>×</span>
      </button>
    </div>
  );
}
