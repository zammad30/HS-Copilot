import { describe, expect, it } from "vitest";
import { sessionSchema } from "./session.schema";

describe("sessionSchema", () => {
  it("parses a session with no name or workspaceName", () => {
    const result = sessionSchema.parse({
      userId: "user_1",
      email: "reviewer@hs-copilot.test",
      workspaceId: "workspace_1",
    });

    expect(result.name).toBeUndefined();
    expect(result.workspaceName).toBeUndefined();
  });

  it("parses a session with name and workspaceName", () => {
    const result = sessionSchema.parse({
      userId: "user_1",
      email: "reviewer@hs-copilot.test",
      workspaceId: "workspace_1",
      name: "Sam Rivera",
      workspaceName: "Sample workspace",
    });

    expect(result.name).toBe("Sam Rivera");
    expect(result.workspaceName).toBe("Sample workspace");
  });

  it("rejects a session missing a required field", () => {
    expect(() =>
      sessionSchema.parse({ email: "reviewer@hs-copilot.test", workspaceId: "workspace_1" }),
    ).toThrow();
  });
});
