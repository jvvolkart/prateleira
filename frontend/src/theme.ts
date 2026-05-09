export const THEME_STORAGE_KEY = "saas_theme";

export function readSavedDark(): boolean {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === "dark") return true;
  if (saved === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyDarkClass(dark: boolean): void {
  document.documentElement.classList.toggle("dark", dark);
}

/** Call once at bootstrap so `/login` and `/register` respect saved preference. */
export function initThemeFromStorage(): void {
  applyDarkClass(readSavedDark());
}
