import { describe, expect, it } from "vitest";
import { auditActionLabel } from "./auditActionLabel";

describe("auditActionLabel", () => {
  it("maps every contract audit action code to its title", () => {
    expect(auditActionLabel("created")).toBe("Classification started");
    expect(auditActionLabel("details_confirmed")).toBe("Product details confirmed");
    expect(auditActionLabel("research_completed")).toBe("Research completed");
    expect(auditActionLabel("approved")).toBe("Classification approved");
    expect(auditActionLabel("overridden")).toBe("Code overridden");
    expect(auditActionLabel("rejected")).toBe("Classification rejected");
    expect(auditActionLabel("info_requested")).toBe("More information requested");
    expect(auditActionLabel("undone")).toBe("Decision undone");
  });

  it("falls back to the raw code for an unmapped action", () => {
    expect(auditActionLabel("something_new")).toBe("something_new");
  });
});
