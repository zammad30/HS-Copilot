import type { ReactNode } from "react";
import { Navigate, useSearchParams } from "react-router";
import { useSession } from "@/entities/session";
import { returnPathFrom } from "../model/returnPath";

export interface RedirectIfSignedInProps {
  children: ReactNode;
}

export function RedirectIfSignedIn({ children }: RedirectIfSignedInProps) {
  const session = useSession();
  const [searchParams] = useSearchParams();

  if (session) {
    return <Navigate to={returnPathFrom(searchParams)} replace />;
  }

  return <>{children}</>;
}
