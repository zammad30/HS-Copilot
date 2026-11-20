import { beforeEach, describe, expect, it } from "vitest";
import { http, ApiError } from "@/shared/api";
import { membersFixtures, resetMembersStore } from "../fixtures/members.fixtures";

interface MemberResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

describe("members handlers", () => {
  beforeEach(() => {
    resetMembersStore();
  });

  it("GET /members returns the workspace member list", async () => {
    const result = await http.get<{ items: MemberResponse[] }>("/members");
    expect(result.items).toHaveLength(membersFixtures.length);
    expect(result.items.map((member) => member.name)).toContain("Alex Morgan");
  });

  it("POST /members/invite creates a new invited member", async () => {
    const created = await http.post<MemberResponse>("/members/invite", {
      email: "new.reviewer@northwind.example",
      role: "reviewer",
    });
    expect(created.status).toBe("invited");
    expect(created.role).toBe("reviewer");

    const list = await http.get<{ items: MemberResponse[] }>("/members");
    expect(list.items).toHaveLength(membersFixtures.length + 1);
  });

  it("POST /members/invite is idempotent for an existing email", async () => {
    const first = await http.post<MemberResponse>("/members/invite", {
      email: "resend.me@northwind.example",
      role: "analyst",
    });
    const second = await http.post<MemberResponse>("/members/invite", {
      email: "resend.me@northwind.example",
      role: "analyst",
    });
    expect(second.id).toBe(first.id);

    const list = await http.get<{ items: MemberResponse[] }>("/members");
    expect(
      list.items.filter((member) => member.email === "resend.me@northwind.example"),
    ).toHaveLength(1);
  });

  it("PATCH /members/:id updates a member's role", async () => {
    const updated = await http.patch<MemberResponse>("/members/member_mina_patel", {
      role: "admin",
    });
    expect(updated.role).toBe("admin");
  });

  it("PATCH /members/:id rejects demoting the last admin", async () => {
    await http.patch("/members/member_sam_rivera", { role: "analyst" });

    await expect(http.patch("/members/member_alex_morgan", { role: "analyst" })).rejects.toThrow(
      ApiError,
    );
  });

  it("DELETE /members/:id rejects removing yourself", async () => {
    await expect(http.delete("/members/member_sam_rivera")).rejects.toThrow(ApiError);
  });

  it("DELETE /members/:id rejects removing the last admin", async () => {
    // Demote Sam first so Alex is the only remaining admin, isolating the
    // last-admin rule from the separate "can't remove yourself" rule.
    await http.patch("/members/member_sam_rivera", { role: "analyst" });
    await expect(http.delete("/members/member_alex_morgan")).rejects.toThrow(ApiError);
  });

  it("DELETE /members/:id removes a non-admin member", async () => {
    await http.delete("/members/member_mina_patel");
    const list = await http.get<{ items: MemberResponse[] }>("/members");
    expect(list.items.map((member) => member.id)).not.toContain("member_mina_patel");
  });
});
