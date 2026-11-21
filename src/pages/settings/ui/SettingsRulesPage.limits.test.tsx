import { useState } from "react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { http } from "@/shared/api";
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
            <SettingsRulesPage />
          </MemoryRouter>
        </TestSessionProvider>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

const HELPER = "Second approver is not included in your plan, so no chapters apply.";
const secondApproverSwitch = () =>
  screen.getByRole("switch", { name: /Require a second approver/ });
const chapter30 = () => screen.getByLabelText("Chapter 30 - Pharmaceutical products");
const saveButton = () => screen.getByRole("button", { name: "Save changes" });

async function waitForForm() {
  await screen.findByLabelText("Highlight for approval above (%)");
}

describe("SettingsRulesPage - plan without a second approver", () => {
  it("disables the control, shows no chapters and explains why", async () => {
    await http.put("/__mock/plan", { plan: "solo" });
    renderPage();
    await waitForForm();

    const notice = await screen.findByRole("status");
    expect(notice).toHaveTextContent("This is not included in your plan.");
    expect(screen.getByRole("link", { name: "See plans" })).toHaveAttribute("href", "/pricing");
    expect(screen.getByText(HELPER)).toBeInTheDocument();
    expect(secondApproverSwitch()).toBeDisabled();
    expect(secondApproverSwitch()).not.toBeChecked();
    // Toggle takes no aria-describedby (shared/ui is out of scope), so the chapters group carries it.
    expect(screen.getByRole("group", { name: "Selected chapters" })).toHaveAttribute(
      "aria-describedby",
      notice.id,
    );
    expect(chapter30()).toBeDisabled();
    expect(chapter30()).not.toBeChecked();
  });

  it("keeps Save disabled on load even when saved rules still hold chapters, then saves an empty list", async () => {
    // Saved while the plan still had the feature, then the plan was downgraded.
    await http.put("/review-rules", {
      highlightAbove: 90,
      requireReviewBelow: 80,
      requireClarifyingQuestion: true,
      requireOverrideReason: true,
      secondApproverChapters: ["30", "85"],
    });
    await http.put("/__mock/plan", { plan: "solo" });
    const user = userEvent.setup();
    renderPage();
    await waitForForm();
    await screen.findByText(HELPER);

    expect(saveButton()).toBeDisabled();
    expect(screen.getByRole("button", { name: "Discard" })).toBeDisabled();
    expect(chapter30()).not.toBeChecked();

    const reviewBelow = screen.getByLabelText("Require review below (%)");
    await user.clear(reviewBelow);
    await user.type(reviewBelow, "70");
    expect(saveButton()).toBeEnabled();
    await user.click(saveButton());

    expect(await screen.findByText("Review rules saved")).toBeInTheDocument();
    const saved = await http.get<{ secondApproverChapters: string[]; requireReviewBelow: number }>(
      "/review-rules",
    );
    expect(saved.secondApproverChapters).toEqual([]);
    expect(saved.requireReviewBelow).toBe(70);
  }, 20000);
});

describe("SettingsRulesPage - plan with a second approver", () => {
  it("leaves the control enabled with no plan notice", async () => {
    renderPage();
    await waitForForm();
    await waitFor(() => expect(secondApproverSwitch()).toBeEnabled());

    expect(screen.queryByRole("link", { name: "See plans" })).not.toBeInTheDocument();
    expect(screen.queryByText(HELPER)).not.toBeInTheDocument();
    expect(
      screen.getByText("Choose the chapters that need a second approver."),
    ).toBeInTheDocument();
  });

  it("shows a refused save as the notice instead of the generic error, one notice only", async () => {
    const user = userEvent.setup();
    renderPage();
    await waitForForm();
    await waitFor(() => expect(secondApproverSwitch()).toBeEnabled());
    await user.click(secondApproverSwitch());
    await user.click(chapter30());
    // The plan changes on the server after the page loaded, so the page is stale.
    await http.put("/__mock/plan", { plan: "solo" });

    await user.click(saveButton());

    // The workspace refetch lands: the permanent notice takes over from the server one.
    await waitFor(() => expect(secondApproverSwitch()).toBeDisabled());
    expect(await screen.findByText(HELPER, undefined, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveTextContent("This is not included in your plan.");
    expect(screen.queryByText("We couldn't save review rules.")).not.toBeInTheDocument();
  }, 20000);
});
