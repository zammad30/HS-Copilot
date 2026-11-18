import type { Session } from "@/entities/session";

/** Builds a session from the submitted email so the mock reflects what was typed. */
export function buildSessionFixture(email: string): Session {
  const localPart = email.split("@")[0] || "user";
  return {
    userId: `user_${localPart}`,
    email,
    workspaceId: "workspace_mock_1",
    workspaceName: "Sample workspace",
  };
}
