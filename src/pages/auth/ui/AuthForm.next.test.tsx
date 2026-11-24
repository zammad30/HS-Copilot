import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider, useLocation } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionContext } from "@/entities/session";
import type { Session } from "@/entities/session";
import { SignInPage } from "./SignInPage";
import { SignUpPage } from "./SignUpPage";

const SESSION: Session = {
  userId: "user_1",
  email: "alex@company.com",
  workspaceId: "workspace_1",
};

function LocationProbe({ label }: { label: string }) {
  const location = useLocation();
  return (
    <p>
      {label}: {location.pathname}
      {location.search}
    </p>
  );
}

function renderAt(initialEntry: string, session: Session | null = null) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const router = createMemoryRouter(
    [
      { path: "/signin", Component: SignInPage },
      { path: "/signup", Component: SignUpPage },
      { path: "/app", element: <LocationProbe label="Home" /> },
      { path: "/app/classify/new", element: <LocationProbe label="Classify" /> },
    ],
    { initialEntries: [initialEntry] },
  );
  render(
    <QueryClientProvider client={queryClient}>
      <SessionContext.Provider value={{ session, setSession: () => {} }}>
        <RouterProvider router={router} />
      </SessionContext.Provider>
    </QueryClientProvider>,
  );
  return router;
}

async function fillSignIn(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Work email"), "alex@company.com");
  await user.type(screen.getByLabelText("Password"), "password123");
  await user.click(screen.getByRole("button", { name: "Sign in" }));
}

describe("AuthForm - return path (?next=)", () => {
  it("sends the user to a safe next path after sign-in, replacing the form in history", async () => {
    const user = userEvent.setup();
    const router = renderAt("/signin?next=%2Fapp%2Fclassify%2Fnew");

    await fillSignIn(user);

    await waitFor(() =>
      expect(screen.getByText("Classify: /app/classify/new")).toBeInTheDocument(),
    );
    expect(router.state.historyAction).toBe("REPLACE");
  });

  it("sends the user to a safe next path after sign-up", async () => {
    const user = userEvent.setup();
    renderAt("/signup?next=%2Fapp%2Fclassify%2Fnew");

    await user.type(screen.getByLabelText("Full name"), "Alex Morgan");
    await user.type(screen.getByLabelText("Work email"), "alex@company.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() =>
      expect(screen.getByText("Classify: /app/classify/new")).toBeInTheDocument(),
    );
  });

  it.each([
    ["an absolute URL", "?next=https%3A%2F%2Fevil.com"],
    ["a protocol-relative URL", "?next=%2F%2Fevil.com"],
    ["a repeated param", "?next=%2Fapp%2Fclassify%2Fnew&next=%2Fapp"],
  ])("falls back to /app for %s", async (_label, search) => {
    const user = userEvent.setup();
    renderAt(`/signin${search}`);

    await fillSignIn(user);

    await waitFor(() => expect(screen.getByText("Home: /app")).toBeInTheDocument());
  });

  it("keeps the validated return path on the switch link, and nothing else", () => {
    renderAt("/signin?next=%2Fapp%2Fclassify%2Fnew%3Fq%3Dsecret");

    expect(screen.getByRole("link", { name: "Create account" })).toHaveAttribute(
      "href",
      "/signup?next=%2Fapp%2Fclassify%2Fnew",
    );
  });

  it("does not add a next param when none was given", () => {
    renderAt("/signin");

    expect(screen.getByRole("link", { name: "Create account" })).toHaveAttribute("href", "/signup");
  });

  it("sends an already signed-in visitor straight to the safe next path", () => {
    renderAt("/signup?next=%2Fapp%2Fclassify%2Fnew", SESSION);

    expect(screen.getByText("Classify: /app/classify/new")).toBeInTheDocument();
  });
});
