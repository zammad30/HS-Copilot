import { useState } from "react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { http } from "@/shared/api";
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

function renderPage() {
  function TestSessionProvider({ children }: { children: ReactNode }) {
    const [current, setSession] = useState<Session | null>(ADMIN_SESSION);
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

const inviteButton = () => screen.getByRole("button", { name: "Invite member" });

async function inviteViaDialog(user: ReturnType<typeof userEvent.setup>, email: string) {
  await user.click(inviteButton());
  const dialog = await screen.findByRole("dialog", { name: "Invite member" });
  await user.type(within(dialog).getByLabelText("Email"), email);
  await user.click(within(dialog).getByRole("button", { name: "Send invite" }));
  return dialog;
}

describe("SettingsMembersPage - seats", () => {
  it("shows how many people are used of the plan's seats", async () => {
    renderPage();

    expect(await screen.findByText("4 of 5 people")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "See plans" })).not.toBeInTheDocument();
    expect(inviteButton()).toBeEnabled();
  });

  it("disables invite and explains why when every seat is taken", async () => {
    await http.put("/__mock/plan", { plan: "free" });
    renderPage();

    expect(await screen.findByText("4 of 1 people")).toBeInTheDocument();
    const notice = await screen.findByRole("status");
    expect(notice).toHaveTextContent("Your plan allows 1 people.");
    expect(screen.getByRole("link", { name: "See plans" })).toHaveAttribute("href", "/pricing");
    expect(inviteButton()).toBeDisabled();
    expect(inviteButton()).toHaveAttribute("aria-describedby", notice.id);
  });

  it("fills the seats after an invite and still lets an invited member be resent", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("4 of 5 people");

    await inviteViaDialog(user, "new.hire@northwind.example");

    expect(
      await screen.findByText("5 of 5 people", undefined, { timeout: 5000 }),
    ).toBeInTheDocument();
    await waitFor(() => expect(inviteButton()).toBeDisabled());
    expect(screen.getByText("Your plan allows 5 people.")).toBeInTheDocument();

    await user.click(await screen.findByRole("button", { name: "Actions for New Hire" }));
    await user.click(await screen.findByRole("menuitem", { name: "Resend invite" }));
    expect(await screen.findByText("Invitation sent again")).toBeInTheDocument();
  }, 20000);

  it("updates the line after a member is removed", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("4 of 5 people");

    await user.click(await screen.findByRole("button", { name: "Actions for Jordan Lee" }));
    await user.click(await screen.findByRole("menuitem", { name: "Remove" }));
    const dialog = await screen.findByRole("dialog", { name: "Remove member?" });
    await user.click(within(dialog).getByRole("button", { name: "Remove" }));

    expect(
      await screen.findByText("3 of 5 people", undefined, { timeout: 5000 }),
    ).toBeInTheDocument();
  }, 15000);

  it("shows a refused invite as the notice inside the modal, and refetches the workspace", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("4 of 5 people");
    // The server fills up after the page loaded, so the page still believes a seat is free.
    await http.post("/members/invite", { email: "late.hire@northwind.example", role: "analyst" });

    const dialog = await inviteViaDialog(user, "another@northwind.example");

    expect(await within(dialog).findByText("Your plan allows 5 people.")).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: "See plans" })).toBeInTheDocument();
    expect(
      screen.queryByText("We couldn't send the invitation. Try again."),
    ).not.toBeInTheDocument();
    // The workspace refetch lands: the line updates, and only one notice is on screen.
    expect(
      await screen.findByText("5 of 5 people", undefined, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(screen.queryAllByText("Your plan allows 5 people.")).toHaveLength(1);

    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Invite member" })).not.toBeInTheDocument(),
    );
    expect(screen.getAllByText("Your plan allows 5 people.")).toHaveLength(1);
    expect(inviteButton()).toBeDisabled();
  }, 20000);
});
