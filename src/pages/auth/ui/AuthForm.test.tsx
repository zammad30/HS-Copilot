import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionContext } from "@/entities/session";
import { AuthForm } from "./AuthForm";
import type { AuthMode } from "./AuthForm";

function renderAuthForm(mode: AuthMode, setSession = vi.fn()) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });

  return {
    setSession,
    ...render(
      <QueryClientProvider client={queryClient}>
        <SessionContext.Provider value={{ session: null, setSession }}>
          <MemoryRouter initialEntries={[`/${mode}`]}>
            <Routes>
              <Route path={`/${mode}`} element={<AuthForm mode={mode} />} />
              <Route path="/app" element={<div>App reached</div>} />
              <Route path="/signin" element={<div>Sign-in route reached</div>} />
            </Routes>
          </MemoryRouter>
        </SessionContext.Provider>
      </QueryClientProvider>,
    ),
  };
}

describe("AuthForm — sign-in", () => {
  it("shows inline validation errors and does not submit", async () => {
    const user = userEvent.setup();
    renderAuthForm("sign-in");

    await user.type(screen.getByLabelText("Work email"), "not-an-email");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(screen.getByText("Enter a valid work email address.")).toBeInTheDocument();
    expect(screen.getByText("Enter your password.")).toBeInTheDocument();
  });

  it("focuses the first invalid field on a failed submit", async () => {
    const user = userEvent.setup();
    renderAuthForm("sign-in");

    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(screen.getByLabelText("Work email")).toHaveFocus();
  });

  it("shows the pending state and disables the submit button while the mutation is in flight", async () => {
    const user = userEvent.setup();
    renderAuthForm("sign-in");

    await user.type(screen.getByLabelText("Work email"), "alex@company.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(screen.getByRole("button", { name: "Sign in" })).toBeDisabled();
  });

  it("navigates to /app and sets the session on success", async () => {
    const user = userEvent.setup();
    const { setSession } = renderAuthForm("sign-in");

    await user.type(screen.getByLabelText("Work email"), "alex@company.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(screen.getByText("App reached")).toBeInTheDocument());
    expect(setSession).toHaveBeenCalledWith(expect.objectContaining({ email: "alex@company.com" }));
  });
});

describe("AuthForm — sign-up", () => {
  it("requires a full name", async () => {
    const user = userEvent.setup();
    renderAuthForm("sign-up");

    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(screen.getByText("Enter your full name.")).toBeInTheDocument();
  });

  it("requires an 8-character password", async () => {
    const user = userEvent.setup();
    renderAuthForm("sign-up");

    await user.type(screen.getByLabelText("Full name"), "Alex Morgan");
    await user.type(screen.getByLabelText("Work email"), "alex@company.com");
    await user.type(screen.getByLabelText("Password"), "short");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(screen.getByText("Password must be at least 8 characters.")).toBeInTheDocument();
  });
});

describe("AuthForm — reset", () => {
  it("shows the in-place confirmation without revealing whether the account exists", async () => {
    const user = userEvent.setup();
    renderAuthForm("reset");

    await user.type(screen.getByLabelText("Work email"), "alex@company.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    await waitFor(() =>
      expect(
        screen.getByText("If that email matches a workspace, we’ve sent a reset link."),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByLabelText("Work email")).not.toBeInTheDocument();
  });
});
