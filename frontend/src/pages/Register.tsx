import { type FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { PrateleiraLogo } from "../components/PrateleiraLogo";

export function Register() {
  const { register, token } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (token) {
    return <Navigate to="/app" replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({
        email,
        password,
        company_name: companyName.trim(),
      });
      navigate("/app", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar a conta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center px-4 pt-8 pb-[100px] font-sans">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200/80 bg-white/95 p-5 shadow-lg shadow-zinc-200/40 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/90 dark:shadow-black/35 sm:p-6">
        <div className="mb-6 mt-2 text-center">
          <PrateleiraLogo size="hero" />
        </div>

        <h1 className="text-left text-2xl font-semibold tracking-tight text-clinic-600 dark:text-clinic-400">
          Criar conta
        </h1>
        <p className="mt-2 text-left text-sm text-zinc-600 dark:text-cream/75">
          Uma nova empresa será criada com o nome abaixo. O primeiro cadastro desta
          empresa é{" "}
          <strong className="font-semibold text-zinc-900 dark:text-cream">
            administrador
          </strong>
          .
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4" aria-busy={loading}>
          <label className="block text-sm font-medium text-zinc-700 dark:text-cream/75">
            Nome da empresa
            <input
              type="text"
              required
              minLength={2}
              maxLength={120}
              autoComplete="organization"
              placeholder="Ex.: Clínica Exemplo"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 shadow-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-clinic-500/50 focus:ring-2 focus:ring-clinic-500/40 dark:border-zinc-700 dark:bg-zinc-950 dark:text-cream dark:placeholder:text-cream/35"
            />
          </label>

          <label className="block text-sm font-medium text-zinc-700 dark:text-cream/75">
            E-mail
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="voce@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 shadow-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-clinic-500/50 focus:ring-2 focus:ring-clinic-500/40 dark:border-zinc-700 dark:bg-zinc-950 dark:text-cream dark:placeholder:text-cream/35"
            />
          </label>

          <label className="block text-sm font-medium text-zinc-700 dark:text-cream/75">
            Senha
            <input
              type="password"
              required
              autoComplete="new-password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 shadow-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-clinic-500/50 focus:ring-2 focus:ring-clinic-500/40 dark:border-zinc-700 dark:bg-zinc-950 dark:text-cream dark:placeholder:text-cream/35"
            />
          </label>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-clinic-500 px-4 py-2.5 text-sm font-semibold text-black shadow-sm transition-colors hover:bg-clinic-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Criando…" : "Criar conta"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-zinc-500 dark:text-cream/60">
          Já tem conta?{" "}
          <Link
            to="/login"
            className="font-medium text-clinic-600 underline-offset-2 hover:text-clinic-500 hover:underline dark:text-clinic-400 dark:hover:text-clinic-300"
          >
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
