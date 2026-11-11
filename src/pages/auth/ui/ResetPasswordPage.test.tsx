import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionContext } from "@/entities/session";
import type { Session } from "@/entities/session";
import { ResetPasswordPage } from "./ResetPasswordPage";

const SESSION: Session = {
  userId: "user_1",
  email: "alex@company.com",
  workspaceId: "workspace_1",
};

function renderResetPage(session: Session | null = null) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <SessionContext.Provider value={{ session, setSession: () => {} }}>
        <MemoryRouter initialEntries={["/reset"]}>
          <Routes>
            <Route path="/reset" element={<ResetPasswordPage />} />
            <Route path="/signin" element={<div>Sign-in route reached</div>} />
          </Routes>
        </MemoryRouter>
      </SessionContext.Provider>
    </QueryClientProvider>,
  );
}

describe("ResetPasswordPage", () => {
  it("renders the reset form", () => {
    renderResetPage();
    expect(
      screen.getByRole("heading", { level: 1, name: "Reset your password" }),
    ).toBeInTheDocument();
  });

  it("links back to sign in", async () => {
    const user = userEvent.setup();
    renderResetPage();

    await user.click(screen.getByRole("link", { name: "Back to sign in" }));
    expect(screen.getByText("Sign-in route reached")).toBeInTheDocument();
  });

  it("does not redirect even when already signed in", () => {
    renderResetPage(SESSION);
    expect(
      screen.getByRole("heading", { level: 1, name: "Reset your password" }),
    ).toBeInTheDocument();
  });
});
