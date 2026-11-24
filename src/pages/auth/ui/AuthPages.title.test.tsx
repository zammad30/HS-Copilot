import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionContext } from "@/entities/session";
import { SignInPage } from "./SignInPage";
import { SignUpPage } from "./SignUpPage";
import { ResetPasswordPage } from "./ResetPasswordPage";

function renderPage(page: ReactNode) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <SessionContext.Provider value={{ session: null, setSession: () => {} }}>
        <MemoryRouter>{page}</MemoryRouter>
      </SessionContext.Provider>
    </QueryClientProvider>,
  );
}

describe("auth pages document title", () => {
  it("titles the sign-in page", () => {
    renderPage(<SignInPage />);
    expect(document.title).toBe("Sign in | HS Copilot");
  });

  it("titles the sign-up page", () => {
    renderPage(<SignUpPage />);
    expect(document.title).toBe("Create account | HS Copilot");
  });

  it("titles the reset password page", () => {
    renderPage(<ResetPasswordPage />);
    expect(document.title).toBe("Reset password | HS Copilot");
  });
});
