import { describe, expect, it } from "vitest";
import { http } from "@/shared/api";
import { membersFixtures } from "../fixtures/members.fixtures";

describe("members handlers", () => {
  it("GET /members returns the workspace member list", async () => {
    const result = await http.get<{ items: { id: string; name: string }[] }>("/members");
    expect(result.items).toHaveLength(membersFixtures.length);
    expect(result.items.map((member) => member.name)).toContain("Alex Morgan");
  });
});
