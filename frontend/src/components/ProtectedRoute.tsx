import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

/** Only gates on token. Session bootstrap (`fetchMe`) is handled inside `/app` so you get one coherent loading UI (e.g. Dashboard skeleton), not a fullscreen spinner then skeleton. */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
