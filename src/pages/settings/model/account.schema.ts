import { z } from "zod";

export const accountUpdateResponseSchema = z.object({ name: z.string() });
export type AccountUpdateResponse = z.infer<typeof accountUpdateResponseSchema>;
