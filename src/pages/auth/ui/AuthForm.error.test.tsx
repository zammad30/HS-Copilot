import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionContext } from "@/entities/session";
import { AuthForm } from "./AuthForm";

type MutateOptions = { onError: (error: Error) => void };

// Same shape the component reads off the real hook: mutate, isPending, error.
vi.mock("../api/signIn.mutation", () => ({
  useSignIn: () => ({
    mutate: (_values: unknown, { onError }: MutateOptions) =>
      onError(new Error("mock sign-in failure")),
    isPending: false,
    error: null,
  }),
}));

vi.mock("../api/resetPassword.mutation", () => ({
  useResetPassword: () => ({
    mutate: (_values: unknown, { onError }: MutateOptions) =>
      onError(new Error("mock reset failure")),
    isPending: false,
    error: null,
  }),
}));

function renderAuthForm(mode: "sign-in" | "reset") {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });

  return render(
    <QueryClientProvider client={queryClient}>
      <SessionContext.Provider value={{ session: null, setSession: vi.fn() }}>
        <MemoryRouter initialEntries={[`/${mode}`]}>
          <Routes>
            <Route path={`/${mode}`} element={<AuthForm mode={mode} />} />
          </Routes>
        </MemoryRouter>
      </SessionContext.Provider>
    </QueryClientProvider>,
  );
}

describe("AuthForm - mocked mutation failures", () => {
  it("shows the error banner, keeps the email and clears the password on a failed sign-in", async () => {
    const user = userEvent.setup();
    renderAuthForm("sign-in");

    await user.type(screen.getByLabelText("Work email"), "alex@company.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() =>
      expect(
        screen.getByText("We couldn't sign you in. Check your email and password and try again."),
      ).toBeInTheDocument(),
    );
    expect(screen.getByLabelText("Work email")).toHaveValue("alex@company.com");
    expect(screen.getByLabelText("Password")).toHaveValue("");
  });

  it("shows the error banner on a failed reset", async () => {
    const user = userEvent.setup();
    renderAuthForm("reset");

    await user.type(screen.getByLabelText("Work email"), "alex@company.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    await waitFor(() =>
      expect(screen.getByText("We couldn't send the reset link. Try again.")).toBeInTheDocument(),
    );
  });
});
