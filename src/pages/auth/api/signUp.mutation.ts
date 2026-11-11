import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { http, parseResponse } from "@/shared/api";
import { sessionSchema } from "@/entities/session";
import type { SignUpValues } from "../model/auth.schema";

const signUpResponseSchema = z.object({ session: sessionSchema });

export function useSignUp() {
  return useMutation({
    mutationFn: async (values: SignUpValues) => {
      const data = await http.post("/auth/sign-up", values);
      return parseResponse(signUpResponseSchema, data).session;
    },
  });
}
