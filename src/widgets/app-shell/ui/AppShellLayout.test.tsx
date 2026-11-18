import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { useSession, useSignOut } from "@/entities/session";
import { useHealthCheck } from "../api/health.query";
import { AppShellLayout } from "./AppShellLayout";

vi.mock("@/entities/session", async () => {
  const actual = await vi.importActual<typeof import("@/entities/session")>("@/entities/session");
  return { ...actual, useSession: vi.fn(), useSignOut: vi.fn() };
});
vi.mock("../api/health.query", () => ({ useHealthCheck: vi.fn() }));

const mockedUseSession = vi.mocked(useSession);
const mockedUseSignOut = vi.mocked(useSignOut);
const mockedUseHealthCheck = vi.mocked(useHealthCheck);

function renderShell() {
  const router = createMemoryRouter(
    [
      {
        Component: AppShellLayout,
        children: [{ path: "/app", Component: () => <p>Home page</p> }],
      },
    ],
    { initialEntries: ["/app"] },
  );
  return render(<RouterProvider router={router} />);
}

describe("AppShellLayout", () => {
  beforeEach(() => {
    mockedUseHealthCheck.mockReturnValue({
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useHealthCheck>);
  });

  it("renders the sidebar, topbar workspace label and the routed content", () => {
    mockedUseSession.mockReturnValue({
      userId: "user_1",
      email: "sam@hs-copilot.test",
      workspaceId: "workspace_1",
      name: "Sam Rivera",
      workspaceName: "Sample workspace",
    });
    mockedUseSignOut.mockReturnValue(vi.fn());

    renderShell();

    expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
    expect(screen.getByText("Sample workspace")).toBeInTheDocument();
    expect(screen.getByText("Home page")).toBeInTheDocument();
  });

  it("opens the mobile nav drawer from the hamburger", async () => {
    mockedUseSession.mockReturnValue({
      userId: "user_1",
      email: "sam@hs-copilot.test",
      workspaceId: "workspace_1",
    });
    mockedUseSignOut.mockReturnValue(vi.fn());
    const user = userEvent.setup();

    renderShell();

    await user.click(screen.getByLabelText("Open navigation"));
    expect(screen.getByRole("dialog", { name: "Navigation menu" })).toBeInTheDocument();
  });

  it("calls only the sign-out hook, with no manual navigation call", async () => {
    const signOut = vi.fn();
    mockedUseSession.mockReturnValue({
      userId: "user_1",
      email: "sam@hs-copilot.test",
      workspaceId: "workspace_1",
    });
    mockedUseSignOut.mockReturnValue(signOut);
    const user = userEvent.setup();

    renderShell();

    await user.click(screen.getByRole("button", { name: "Sign out" }));
    expect(signOut).toHaveBeenCalledTimes(1);
    // The routed child is still "Home page" — AppShellLayout itself never calls
    // navigate() on sign-out; RequireSession (outside this tree) owns the redirect.
    expect(screen.getByText("Home page")).toBeInTheDocument();
  });
});
