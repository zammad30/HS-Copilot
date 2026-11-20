import { useState } from "react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { ToastProvider } from "@/shared/ui/Toast";
import { SessionContext } from "@/entities/session";
import type { Session } from "@/entities/session";
import { SettingsRulesPage } from "./SettingsRulesPage";

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
            <SettingsRulesPage />
          </MemoryRouter>
        </TestSessionProvider>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe("SettingsRulesPage", () => {
  it("loads the thresholds with Save/Discard disabled until the form changes", async () => {
    renderPage(ADMIN_SESSION);
    await screen.findByLabelText("Highlight for approval above (%)");

    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Discard" })).toBeDisabled();
  });

  it("validates thresholds as 0-100 and blocks saving out of range", async () => {
    const user = userEvent.setup();
    renderPage(ADMIN_SESSION);
    const highlight = await screen.findByLabelText("Highlight for approval above (%)");

    await user.clear(highlight);
    await user.type(highlight, "150");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(screen.getByText("Enter a value from 0 to 100.")).toBeInTheDocument();
  });

  it("discard reverts an unsaved edit without making a request", async () => {
    const user = userEvent.setup();
    renderPage(ADMIN_SESSION);
    const reviewBelow = await screen.findByLabelText("Require review below (%)");
    const original = (reviewBelow as HTMLInputElement).value;

    await user.clear(reviewBelow);
    await user.type(reviewBelow, "55");
    expect(reviewBelow).toHaveValue(55);

    await user.click(screen.getByRole("button", { name: "Discard" }));
    expect(reviewBelow).toHaveValue(Number(original));
  });

  it("disables the chapters group while the second-approver toggle is off", async () => {
    renderPage(ADMIN_SESSION);
    await screen.findByLabelText("Highlight for approval above (%)");

    expect(screen.getByLabelText("Chapter 30 - Pharmaceutical products")).toBeDisabled();
  });

  it("tapping a chapter checkbox toggles it once the second-approver toggle is on, then saves", async () => {
    const user = userEvent.setup();
    renderPage(ADMIN_SESSION);
    await screen.findByLabelText("Highlight for approval above (%)");

    await user.click(screen.getByRole("switch", { name: /Require a second approver/ }));
    const chapter = screen.getByLabelText("Chapter 30 - Pharmaceutical products");
    expect(chapter).toBeEnabled();
    expect(chapter).not.toBeChecked();

    await user.click(chapter);
    expect(chapter).toBeChecked();

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Review rules saved");
  });

  it("discard reverts a chapter selection change and re-disables the group", async () => {
    const user = userEvent.setup();
    renderPage(ADMIN_SESSION);
    await screen.findByLabelText("Highlight for approval above (%)");

    await user.click(screen.getByRole("switch", { name: /Require a second approver/ }));
    const chapter = screen.getByLabelText("Chapter 30 - Pharmaceutical products");
    await user.click(chapter);
    expect(chapter).toBeChecked();

    await user.click(screen.getByRole("button", { name: "Discard" }));

    expect(chapter).not.toBeChecked();
    expect(chapter).toBeDisabled();
  });

  it("gates the tab for non-admins with a banner and disabled controls", async () => {
    renderPage(REVIEWER_SESSION);
    await screen.findByLabelText("Highlight for approval above (%)");

    expect(screen.getByText("Only admins can change review rules.")).toBeInTheDocument();
    expect(screen.getByLabelText("Highlight for approval above (%)")).toBeDisabled();
  });
});
