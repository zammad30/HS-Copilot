import { z } from "zod";

const envSchema = z.object({
  useMocks: z.boolean(),
  apiBaseUrl: z.string().min(1),
});

export const env = envSchema.parse({
  useMocks: import.meta.env.VITE_USE_MOCKS === "true",
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api/v1",
});
