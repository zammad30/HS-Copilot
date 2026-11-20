import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider, useParams } from "react-router";
import { ClassifyNewPage } from "./ClassifyNewPage";

function DetailProbe() {
  const { id } = useParams();
  return <p data-testid="detail-id">{id}</p>;
}

function renderPage(initialEntry: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const router = createMemoryRouter(
    [
      { path: "/app/classify/new", Component: ClassifyNewPage },
      { path: "/app/classifications/:id", Component: DetailProbe },
    ],
    { initialEntries: [initialEntry] },
  );

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe("ClassifyNewPage - form validation", () => {
  it("requires a non-empty description, focuses the field, and sends no request", async () => {
    const user = userEvent.setup();
    renderPage("/app/classify/new");

    await user.click(screen.getByRole("button", { name: "Research HS codes" }));

    expect(screen.getByText("Enter a product description.")).toBeInTheDocument();
    expect(screen.getByLabelText("Product description")).toHaveFocus();
    expect(screen.getByLabelText("Product description")).not.toBeDisabled();
  });

  it("rejects a description over 1000 characters", async () => {
    const user = userEvent.setup();
    renderPage("/app/classify/new");

    const textarea = screen.getByLabelText("Product description");
    await user.click(textarea);
    await user.paste("a".repeat(1001));
    await user.click(screen.getByRole("button", { name: "Research HS codes" }));

    expect(screen.getByText("Use 1000 characters or fewer.")).toBeInTheDocument();
    expect(textarea).toHaveFocus();
  });
});

describe("ClassifyNewPage - prefill", () => {
  it("initialises the description from ?q= and keeps it editable", async () => {
    const user = userEvent.setup();
    renderPage("/app/classify/new?q=Wireless%20earbuds");

    const textarea = screen.getByLabelText("Product description");
    expect(textarea).toHaveValue("Wireless earbuds");

    await user.type(textarea, " with case");
    expect(textarea).toHaveValue("Wireless earbuds with case");
  });
});

describe("ClassifyNewPage - run not found", () => {
  it("shows Run not found for an unknown run id, with a usable form and a Start again link", async () => {
    renderPage("/app/classify/new?run=does-not-exist");

    expect(await screen.findByText("Run not found")).toBeInTheDocument();
    expect(
      screen.getByText("This research run is no longer available. Start a new one."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Product description")).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "Start again" })).toBeInTheDocument();
  });
});

describe("ClassifyNewPage - run lifecycle via MSW", () => {
  it("polls through research, answers the clarifying question, and navigates on completion", async () => {
    const user = userEvent.setup();
    renderPage("/app/classify/new");

    await user.type(
      screen.getByLabelText("Product description"),
      "Wireless Bluetooth earbuds with charging case",
    );
    await user.click(screen.getByRole("button", { name: "Research HS codes" }));

    // Fields are disabled while the run is active.
    await waitFor(() => expect(screen.getByLabelText("Product description")).toBeDisabled());

    // Polling advances step state from the mock's request-driven state machine.
    await waitFor(
      () => expect(screen.getByText("Paused for a clarifying detail.")).toBeInTheDocument(),
      { timeout: 15000 },
    );
    expect(screen.getByRole("heading", { name: /clarifying question/i })).toHaveFocus();

    await user.click(
      screen.getByRole("button", { name: /yes.*the description covers its primary use/i }),
    );

    await waitFor(() => expect(screen.getByTestId("detail-id")).toBeInTheDocument(), {
      timeout: 15000,
    });
  }, 20000);
});
