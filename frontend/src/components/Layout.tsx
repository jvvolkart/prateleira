import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ChatSessionProvider } from "../chat/ChatSessionContext";
import { PrateleiraLogo } from "./PrateleiraLogo";
import { ThemeToggle } from "./ThemeToggle";

function navClass({ isActive }: { isActive: boolean }): string {
  return [
    "text-sm font-medium transition-colors",
    isActive
      ? "text-clinic-600 dark:text-clinic-400"
      : "text-zinc-600 hover:text-zinc-900 dark:text-cream/70 dark:hover:text-cream",
  ].join(" ");
}

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-svh bg-zinc-50 font-sans text-zinc-900 dark:bg-black dark:text-cream">
      <header className="sticky top-0 z-40 border-b border-zinc-200/90 bg-white/90 backdrop-blur-md dark:border-zinc-800/90 dark:bg-black/85 dark:supports-[backdrop-filter]:bg-black/70">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-8">
            <Link
              to="/app"
              className="group flex shrink-0 items-center opacity-100 transition-opacity hover:opacity-90"
            >
              <PrateleiraLogo
                size="header"
                className="group-hover:[&_.font-semibold]:text-clinic-700 dark:group-hover:[&_.font-semibold]:text-cream"
              />
            </Link>

            <nav
              className="flex items-center gap-6 sm:gap-8"
              aria-label="Principal"
            >
              <NavLink to="/app" end className={navClass}>
                Dashboard
              </NavLink>
              <NavLink to="/app/chat" className={navClass}>
                Chat
              </NavLink>
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {user && (
              <div className="hidden max-w-[200px] truncate text-right text-xs leading-tight text-zinc-500 md:block dark:text-cream/55">
                <div className="truncate text-zinc-900 dark:text-cream">{user.email}</div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-400 dark:text-cream/50">
                  {user.role === "admin" ? "Administrador" : "Equipe"}
                </div>
              </div>
            )}
            <div className="hidden h-8 w-px bg-zinc-200 sm:block dark:bg-zinc-800/80" aria-hidden />
            <ThemeToggle />
            <button
              type="button"
              onClick={() => logout()}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-800 transition-colors hover:border-zinc-400 hover:bg-zinc-50 sm:text-sm dark:border-zinc-700 dark:bg-zinc-950/50 dark:text-cream/90 dark:hover:border-zinc-600 dark:hover:bg-zinc-900"
            >
              Sair
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <ChatSessionProvider>
          <Outlet />
        </ChatSessionProvider>
      </main>
    </div>
  );
}
