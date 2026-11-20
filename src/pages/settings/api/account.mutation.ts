import { useMutation } from "@tanstack/react-query";
import { http, parseResponse } from "@/shared/api";
import { accountUpdateResponseSchema } from "../model/account.schema";

export function useUpdateAccount() {
  return useMutation({
    mutationFn: async (input: { name: string }) => {
      const data = await http.patch("/me", input);
      return parseResponse(accountUpdateResponseSchema, data);
    },
  });
}
