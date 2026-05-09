type PrateleiraLogoProps = {
  className?: string;
  /** `header` = barra compacta; `hero` = páginas de login/cadastro */
  size?: "header" | "hero";
};

/**
 * Logotipo tipográfico + CSS: prateleiras à esquerda; última letra em dourado.
 */
export function PrateleiraLogo({
  className = "",
  size = "header",
}: PrateleiraLogoProps) {
  const scale = size === "hero" ? "text-2xl sm:text-[1.65rem]" : "text-lg";
  const shelf = size === "hero" ? "h-0.5 w-4 sm:w-5" : "h-0.5 w-3.5";

  return (
    <span
      className={`inline-flex items-center gap-2 ${scale} ${className}`}
      translate="no"
    >
      <span
        className="flex flex-col justify-center gap-[3px] opacity-90"
        aria-hidden
      >
        <span
          className={`${shelf} rounded-full bg-gradient-to-r from-clinic-600 via-clinic-500 to-clinic-400 dark:from-clinic-500 dark:to-amber-200/85`}
        />
        <span
          className={`${shelf} w-[1.35em] max-w-[1.25rem] rounded-full bg-zinc-700 dark:bg-zinc-300 ${size === "hero" ? "max-w-[1.4rem]" : ""}`}
        />
        <span
          className={`${shelf} rounded-full bg-gradient-to-r from-clinic-500 to-clinic-600 dark:from-clinic-400 dark:to-clinic-600`}
        />
      </span>
      <span className="flex items-baseline gap-0 tracking-tight">
        <span className="font-semibold text-zinc-900 dark:text-cream">
          Prateleir
        </span>
        <span className="font-black tracking-tighter text-clinic-600 dark:text-clinic-400">
          a
        </span>
      </span>
    </span>
  );
}
