import { describe, expect, it } from "vitest";
import { http } from "@/shared/api";

// Exercises the real http client against the real MSW handler (registered
// globally in tests/setup.ts) to confirm an empty 204 response resolves
// cleanly, with no mock of @/shared/api and no import of app/mocks here.
describe("POST /auth/sign-out", () => {
  it("resolves with no body for a 204 response", async () => {
    await expect(http.post("/auth/sign-out")).resolves.toBeUndefined();
  });
});
