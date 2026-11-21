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
import { SettingsGeneralPage } from "./SettingsGeneralPage";

const ADMIN_SESSION: Session = {
  userId: "user_mock_1",
  email: "reviewer@hs-copilot.test",
  workspaceId: "workspace_mock_1",
  name: "Sam Rivera",
  workspaceName: "Sample workspace",
  role: "admin",
};

function TestSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(ADMIN_SESSION);
  return (
    <SessionContext.Provider value={{ session, setSession }}>
      <p data-testid="session-probe">{`${session?.name ?? ""}|${session?.workspaceName ?? ""}`}</p>
      {children}
    </SessionContext.Provider>
  );
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider durationMs={{ default: 300, withAction: 800 }}>
        <TestSessionProvider>
          <MemoryRouter>
            <SettingsGeneralPage />
          </MemoryRouter>
        </TestSessionProvider>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe("SettingsGeneralPage", () => {
  it("labels the field Default destination, lists the six destinations, and shows the helper text", async () => {
    renderPage();

    const select = await screen.findByLabelText("Default destination");
    expect(screen.queryByLabelText("Default jurisdiction")).not.toBeInTheDocument();
    expect(screen.getByText("Turkey")).toBeInTheDocument();
    expect(
      Array.from(select.querySelectorAll("option")).map((option) => option.textContent),
    ).toEqual([
      "United States",
      "European Union",
      "United Kingdom",
      "Canada",
      "Australia",
      "Turkey",
    ]);
    expect(
      screen.getByText(
        "Used as the starting value for new classifications. You can change it for each one.",
      ),
    ).toBeInTheDocument();
    expect(select).toHaveAccessibleDescription(
      "Used as the starting value for new classifications. You can change it for each one.",
    );
  });

  it("loads workspace defaults with Save disabled until edited, then saves and updates the session", async () => {
    const user = userEvent.setup();
    renderPage();

    const nameInput = await screen.findByLabelText("Workspace name");
    const saveButtons = screen.getAllByRole("button", { name: "Save changes" });
    expect(saveButtons[0]).toBeDisabled();

    await user.clear(nameInput);
    await user.type(nameInput, "Northwind Imports");
    expect(saveButtons[0]).toBeEnabled();
    await user.click(saveButtons[0]);

    expect(await screen.findByRole("status")).toHaveTextContent("Settings saved");
    expect(screen.getByTestId("session-probe")).toHaveTextContent("Northwind Imports");
  });

  it("edits and saves the display name, updating the session", async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByLabelText("Workspace name");
    const nameInput = screen.getByLabelText("Display name");
    const saveButtons = screen.getAllByRole("button", { name: "Save changes" });

    await user.clear(nameInput);
    await user.type(nameInput, "Jamie Chen");
    expect(saveButtons[1]).toBeEnabled();
    await user.click(saveButtons[1]);

    expect(await screen.findByRole("status")).toHaveTextContent("Settings saved");
    expect(screen.getByTestId("session-probe")).toHaveTextContent("Jamie Chen");
  });

  it("renders the read-only email and a working Sign out button", async () => {
    renderPage();
    await screen.findByLabelText("Workspace name");

    expect(screen.getByLabelText("Email")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });
});
