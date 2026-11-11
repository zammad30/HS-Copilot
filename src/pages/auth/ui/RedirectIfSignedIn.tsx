import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { useSession } from "@/entities/session";
import { routes } from "@/shared/config";

export interface RedirectIfSignedInProps {
  children: ReactNode;
}

export function RedirectIfSignedIn({ children }: RedirectIfSignedInProps) {
  const session = useSession();

  if (session) {
    return <Navigate to={routes.home} replace />;
  }

  return <>{children}</>;
}
