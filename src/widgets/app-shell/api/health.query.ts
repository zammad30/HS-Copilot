import { useQuery } from "@tanstack/react-query";
import { http, parseResponse } from "@/shared/api";
import { healthResponseSchema } from "./health.schema";

const HEALTH_TIMEOUT_MS = 60_000;

export function useHealthCheck() {
  return useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const data = await http.get("/health", { signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS) });
      return parseResponse(healthResponseSchema, data);
    },
    staleTime: Infinity,
    retry: 3,
  });
}
