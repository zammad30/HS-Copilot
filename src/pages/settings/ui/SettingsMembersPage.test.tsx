import { useState } from "react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { ToastProvider } from "@/shared/ui/Toast";
import { SessionContext } from "@/entities/session";
import type { Session } from "@/entities/session";
import { SettingsMembersPage } from "./SettingsMembersPage";

const ADMIN_SESSION: Session = {
  userId: "user_mock_1",
  email: "reviewer@hs-copilot.test",
  workspaceId: "workspace_mock_1",
  name: "Sam Rivera",
  workspaceName: "Sample workspace",
  role: "admin",
};

const REVIEWER_SESSION: Session = { ...ADMIN_SESSION, role: "reviewer" };

function renderPage(session: Session) {
  function TestSessionProvider({ children }: { children: ReactNode }) {
    const [current, setSession] = useState<Session | null>(session);
    return (
      <SessionContext.Provider value={{ session: current, setSession }}>
        {children}
      </SessionContext.Provider>
    );
  }

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider durationMs={{ default: 300, withAction: 800 }}>
        <TestSessionProvider>
          <MemoryRouter>
            <SettingsMembersPage />
          </MemoryRouter>
        </TestSessionProvider>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe("SettingsMembersPage", () => {
  it("renders the seeded members with role selects and a status indicator", async () => {
    renderPage(ADMIN_SESSION);

    expect(await screen.findByText("Alex Morgan")).toBeInTheDocument();
    expect(screen.getByText("Jordan Lee")).toBeInTheDocument();
    expect(screen.getByLabelText("Role for Alex Morgan")).toHaveValue("admin");
    expect(screen.getAllByText("Active").length).toBeGreaterThan(0);
  });

  it("invites a new member after validating the email, then supports Resend invite", async () => {
    // Two real mock round trips (300-700ms latency each) plus several user
    // interactions can exceed the default 5s test timeout under load.
    const user = userEvent.setup();
    renderPage(ADMIN_SESSION);
    await screen.findByText("Alex Morgan");

    await user.click(screen.getByRole("button", { name: "Invite member" }));
    const dialog = await screen.findByRole("dialog", { name: "Invite member" });
    await user.type(within(dialog).getByLabelText("Email"), "not-an-email");
    await user.click(within(dialog).getByRole("button", { name: "Send invite" }));
    expect(within(dialog).getByText("Enter a valid email address.")).toBeInTheDocument();

    await user.clear(within(dialog).getByLabelText("Email"));
    await user.type(within(dialog).getByLabelText("Email"), "new.hire@northwind.example");
    await user.click(within(dialog).getByRole("button", { name: "Send invite" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Invitation sent");
    expect(await screen.findByText("new.hire@northwind.example")).toBeInTheDocument();
    expect(screen.getByText("Invited")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Actions for New Hire" }));
    await user.click(await screen.findByRole("menuitem", { name: "Resend invite" }));
    expect(await screen.findByText("Invitation sent again")).toBeInTheDocument();
  }, 15000);

  it("changes a member's role", async () => {
    const user = userEvent.setup();
    renderPage(ADMIN_SESSION);
    await screen.findByText("Mina Patel");

    await user.selectOptions(screen.getByLabelText("Role for Mina Patel"), "admin");

    expect(await screen.findByRole("status")).toHaveTextContent("Role updated");
    expect(screen.getByLabelText("Role for Mina Patel")).toHaveValue("admin");
  });

  it("disables the signed-in user's own role select with an explanatory title", async () => {
    renderPage(ADMIN_SESSION);
    const self = await screen.findByLabelText("Role for Sam Rivera");
    expect(self).toBeDisabled();
    expect(self).toHaveAttribute("title", "You can't change your own role.");
  });

  it("removes a member via the confirm modal, with no Undo offered", async () => {
    const user = userEvent.setup();
    renderPage(ADMIN_SESSION);
    await screen.findByText("Jordan Lee");

    await user.click(screen.getByRole("button", { name: "Actions for Jordan Lee" }));
    await user.click(await screen.findByRole("menuitem", { name: "Remove" }));
    const dialog = await screen.findByRole("dialog", { name: "Remove member?" });
    expect(dialog).toHaveTextContent("Jordan Lee will lose access to this workspace.");
    await user.click(within(dialog).getByRole("button", { name: "Remove" }));

    const toast = await screen.findByRole("status");
    expect(toast).toHaveTextContent("Member removed");
    expect(screen.queryByRole("button", { name: "Undo" })).not.toBeInTheDocument();
  });

  it("gates the tab for non-admins with a banner and disabled controls", async () => {
    renderPage(REVIEWER_SESSION);
    await screen.findByText("Alex Morgan");

    expect(screen.getByText("Only admins can manage members.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Invite member" })).toBeDisabled();
    expect(screen.getByLabelText("Role for Alex Morgan")).toBeDisabled();
  });
});
