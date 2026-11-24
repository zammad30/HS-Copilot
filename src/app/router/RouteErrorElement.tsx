import { useEffect } from "react";
import { useRouteError } from "react-router";
import { routes } from "@/shared/config";
import { RouteErrorScreen } from "@/widgets/route-error";

export interface RouteErrorElementProps {
  scope: "root" | "app";
}

export function RouteErrorElement({ scope }: RouteErrorElementProps) {
  const error = useRouteError();

  useEffect(() => {
    // Development only: production logs nothing, so no error text or route params leak.
    if (import.meta.env.DEV) console.error(error);
  }, [error]);

  return scope === "app" ? (
    <RouteErrorScreen homePath={routes.home} />
  ) : (
    <RouteErrorScreen homePath={routes.landing} isFullPage />
  );
}
