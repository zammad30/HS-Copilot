import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { http, parseResponse } from "@/shared/api";
import type { ResetValues } from "../model/auth.schema";

const resetResponseSchema = z.object({ ok: z.literal(true) });

export function useResetPassword() {
  return useMutation({
    mutationFn: async (values: ResetValues) => {
      const data = await http.post("/auth/reset", values);
      return parseResponse(resetResponseSchema, data);
    },
  });
}
