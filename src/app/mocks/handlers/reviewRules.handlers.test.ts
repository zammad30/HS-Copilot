import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { http } from "@/shared/api";
import { resetReviewRulesStore } from "../fixtures/reviewRules.fixtures";
import { resetPlanStore } from "../fixtures/plans.fixtures";
import type { ReviewRulesFixture } from "../fixtures/reviewRules.fixtures";

describe("review rules handlers", () => {
  beforeEach(() => {
    resetReviewRulesStore();
  });
  afterEach(() => {
    resetPlanStore();
  });

  it("PUT /review-rules saves normally on Team, which has secondApprover", async () => {
    const updated = await http.put<ReviewRulesFixture>("/review-rules", {
      secondApproverChapters: ["84"],
    });
    expect(updated.secondApproverChapters).toEqual(["84"]);
  });

  it("PUT /review-rules is refused with plan_limit_reached reason 'feature' on a plan without secondApprover", async () => {
    await http.put("/__mock/plan", { plan: "solo" });

    await expect(
      http.put("/review-rules", { secondApproverChapters: ["84"] }),
    ).rejects.toMatchObject({
      status: 403,
      code: "plan_limit_reached",
      details: { reason: "feature" },
    });
  });

  it("PUT /review-rules clearing secondApproverChapters to empty is allowed on any plan", async () => {
    await http.put("/__mock/plan", { plan: "solo" });

    const updated = await http.put<ReviewRulesFixture>("/review-rules", {
      secondApproverChapters: [],
    });
    expect(updated.secondApproverChapters).toEqual([]);
  });
});
