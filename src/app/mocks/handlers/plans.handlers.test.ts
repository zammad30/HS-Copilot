import { describe, expect, it } from "vitest";
import { http } from "@/shared/api";
import { PLAN_CATALOG, resetPlanStore } from "../fixtures/plans.fixtures";
import type { PlanFixture } from "../fixtures/plans.fixtures";

interface WorkspaceResponse {
  plan: string;
  limits: PlanFixture["limits"];
  usage: { classificationsUsed: number; batchUploadsUsed: number; seatsUsed: number };
}

describe("plans handlers", () => {
  it("GET /plans returns the fixed catalog, matching the Plan shape", async () => {
    const result = await http.get<{ items: PlanFixture[] }>("/plans");
    expect(result.items).toHaveLength(PLAN_CATALOG.length);
    expect(result.items.map((plan) => plan.id)).toEqual(["free", "solo", "team"]);
    for (const plan of result.items) {
      expect(plan.isSample).toBe(true);
      expect(typeof plan.limits.auditRetentionDays).toBe("number");
    }
  });

  it("PUT /__mock/plan switches the workspace's plan, changing GET /workspace's limits", async () => {
    try {
      await http.put("/__mock/plan", { plan: "free" });
      const workspace = await http.get<WorkspaceResponse>("/workspace");
      expect(workspace.plan).toBe("free");
      expect(workspace.limits.seats).toBe(1);
      expect(workspace.limits.auditRetentionDays).toBe(30);
    } finally {
      resetPlanStore();
    }
  });

  it("PUT /__mock/plan rejects an unsupported plan id", async () => {
    await expect(http.put("/__mock/plan", { plan: "enterprise" })).rejects.toMatchObject({
      status: 422,
    });
  });

  it("GET /workspace's usage reflects the mock usage store, including seatsUsed", async () => {
    const workspace = await http.get<WorkspaceResponse>("/workspace");
    expect(workspace.usage.classificationsUsed).toBe(3);
    expect(workspace.usage.seatsUsed).toBeGreaterThan(0);
  });
});
