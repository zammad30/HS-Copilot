import type { Jurisdiction } from "@/entities/classification";

export interface WorkspaceFixture {
  id: string;
  name: string;
  defaultJurisdiction: Jurisdiction;
}

function createWorkspaceFixture(): WorkspaceFixture {
  // Mirrors entities/session's MOCK_SESSION (workspaceId, workspaceName).
  return { id: "workspace_mock_1", name: "Sample workspace", defaultJurisdiction: "US_HTS" };
}

export const workspaceStore: WorkspaceFixture = createWorkspaceFixture();

export function resetWorkspaceStore(): void {
  Object.assign(workspaceStore, createWorkspaceFixture());
}
