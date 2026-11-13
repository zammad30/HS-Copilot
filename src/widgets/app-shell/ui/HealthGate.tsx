import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useHealthCheck } from "../api/health.query";
import { WakingScreen } from "./WakingScreen";
import { ErrorScreen } from "./ErrorScreen";

const WAKING_SCREEN_DELAY_MS = 800;

export interface HealthGateProps {
  children: ReactNode;
}

export function HealthGate({ children }: HealthGateProps) {
  const { isPending, isError, refetch } = useHealthCheck();
  const [showWaking, setShowWaking] = useState(false);

  useEffect(() => {
    if (!isPending) return;
    const timeout = window.setTimeout(() => setShowWaking(true), WAKING_SCREEN_DELAY_MS);
    return () => window.clearTimeout(timeout);
  }, [isPending]);

  if (isError) {
    return <ErrorScreen onRetry={() => void refetch()} />;
  }

  if (isPending) {
    return showWaking ? <WakingScreen /> : null;
  }

  return <>{children}</>;
}
