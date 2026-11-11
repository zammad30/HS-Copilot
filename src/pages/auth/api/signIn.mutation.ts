import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { http, parseResponse } from "@/shared/api";
import { sessionSchema } from "@/entities/session";
import type { SignInValues } from "../model/auth.schema";

const signInResponseSchema = z.object({ session: sessionSchema });

export function useSignIn() {
  return useMutation({
    mutationFn: async (values: SignInValues) => {
      const data = await http.post("/auth/sign-in", values);
      return parseResponse(signInResponseSchema, data).session;
    },
  });
}
