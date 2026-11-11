import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionContext } from "@/entities/session";
import type { Session } from "@/entities/session";
import { SignUpPage } from "./SignUpPage";

const SESSION: Session = {
  userId: "user_1",
  email: "alex@company.com",
  workspaceId: "workspace_1",
};

function renderSignUpPage(session: Session | null = null) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <SessionContext.Provider value={{ session, setSession: () => {} }}>
        <MemoryRouter initialEntries={["/signup"]}>
          <Routes>
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/signin" element={<div>Sign-in route reached</div>} />
            <Route path="/app" element={<div>App reached</div>} />
          </Routes>
        </MemoryRouter>
      </SessionContext.Provider>
    </QueryClientProvider>,
  );
}

describe("SignUpPage", () => {
  it("renders the sign-up form", () => {
    renderSignUpPage();
    expect(
      screen.getByRole("heading", { level: 1, name: "Start your workspace" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Full name")).toBeInTheDocument();
  });

  it("links to sign-in", async () => {
    const user = userEvent.setup();
    renderSignUpPage();

    await user.click(screen.getByRole("link", { name: "Sign in" }));
    expect(screen.getByText("Sign-in route reached")).toBeInTheDocument();
  });

  it("redirects to /app when already signed in, with no loop", () => {
    renderSignUpPage(SESSION);
    expect(screen.getByText("App reached")).toBeInTheDocument();
  });
});
