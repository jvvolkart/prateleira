/**
 * Barras estilo logo Prateleira + feedback de carregamento.
 */
export function ShelfBarsLoader({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex flex-col items-center gap-1.5 ${className}`}
      aria-hidden
    >
      <span className="h-1 w-10 rounded-full bg-gradient-to-r from-clinic-600 via-clinic-500 to-clinic-400 motion-safe:animate-pulse dark:from-clinic-500 dark:to-amber-200/85" />
      <span className="h-1 w-12 rounded-full bg-zinc-400 motion-safe:animate-pulse dark:bg-zinc-500 [animation-delay:120ms]" />
      <span className="h-1 w-8 rounded-full bg-gradient-to-r from-clinic-500 to-clinic-600 motion-safe:animate-pulse dark:from-clinic-400 dark:to-clinic-600 [animation-delay:240ms]" />
    </div>
  );
}

type PageLoaderProps = {
  /** Texto abaixo do spinner */
  message?: string;
  /** `fullscreen` = tela cheia (ex.: sessão); `embedded` = só o bloco (ex.: dentro do main) */
  variant?: "fullscreen" | "embedded";
  className?: string;
};

/**
 * Loading principal da app: fundo alinhado ao Layout, acessível.
 */
export function PageLoader({
  message = "Carregando…",
  variant = "fullscreen",
  className = "",
}: PageLoaderProps) {
  const shell =
    variant === "fullscreen"
      ? "min-h-svh w-full bg-zinc-50 dark:bg-black"
      : "w-full py-16";

  return (
    <div
      className={`flex flex-col items-center justify-center px-4 ${shell} ${className}`}
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-6">
        <ShelfBarsLoader />
        <div className="relative h-11 w-11">
          <div
            className="absolute inset-0 rounded-full border-2 border-zinc-200 dark:border-zinc-800"
            aria-hidden
          />
          <div
            className="absolute inset-0 motion-safe:animate-spin rounded-full border-2 border-transparent border-t-clinic-500 border-r-clinic-500/50 dark:border-t-clinic-400 dark:border-r-clinic-500/30"
            aria-hidden
          />
        </div>
        <p className="max-w-xs text-center text-sm text-zinc-600 dark:text-cream/65">
          {message}
        </p>
      </div>
    </div>
  );
}

/** Bloco skeleton com pulse escalonado. */
export function SkeletonBlock({
  className = "",
  delayMs = 0,
}: {
  className?: string;
  delayMs?: number;
}) {
  return (
    <div
      className={`rounded-lg bg-zinc-200 motion-safe:animate-pulse dark:bg-zinc-800 ${className}`}
      style={{ animationDelay: `${delayMs}ms` }}
    />
  );
}
