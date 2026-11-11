import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionContext } from "@/entities/session";
import type { Session } from "@/entities/session";
import { SignInPage } from "./SignInPage";

const SESSION: Session = {
  userId: "user_1",
  email: "alex@company.com",
  workspaceId: "workspace_1",
};

function renderSignInPage(session: Session | null = null) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <SessionContext.Provider value={{ session, setSession: () => {} }}>
        <MemoryRouter initialEntries={["/signin"]}>
          <Routes>
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/signup" element={<div>Sign-up route reached</div>} />
            <Route path="/reset" element={<div>Reset route reached</div>} />
            <Route path="/" element={<div>Landing reached</div>} />
            <Route path="/app" element={<div>App reached</div>} />
          </Routes>
        </MemoryRouter>
      </SessionContext.Provider>
    </QueryClientProvider>,
  );
}

describe("SignInPage", () => {
  it("renders the sign-in form", () => {
    renderSignInPage();
    expect(
      screen.getByRole("heading", { level: 1, name: "Sign in to HS Copilot" }),
    ).toBeInTheDocument();
  });

  it("links to sign-up", async () => {
    const user = userEvent.setup();
    renderSignInPage();

    await user.click(screen.getByRole("link", { name: "Create account" }));
    expect(screen.getByText("Sign-up route reached")).toBeInTheDocument();
  });

  it("links to reset password", async () => {
    const user = userEvent.setup();
    renderSignInPage();

    await user.click(screen.getByRole("link", { name: "Forgot password?" }));
    expect(screen.getByText("Reset route reached")).toBeInTheDocument();
  });

  it("links back home", async () => {
    const user = userEvent.setup();
    renderSignInPage();

    await user.click(screen.getByRole("link", { name: "Back home" }));
    expect(screen.getByText("Landing reached")).toBeInTheDocument();
  });

  it("redirects to /app when already signed in, with no loop", () => {
    renderSignInPage(SESSION);
    expect(screen.getByText("App reached")).toBeInTheDocument();
  });
});
