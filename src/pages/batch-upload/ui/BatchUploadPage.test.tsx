import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider, useParams } from "react-router";
import { BatchUploadPage } from "./BatchUploadPage";

function ReviewProbe() {
  const { id } = useParams();
  return <p data-testid="batch-id">{id}</p>;
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const router = createMemoryRouter(
    [
      { path: "/app/batches/new", Component: BatchUploadPage },
      { path: "/app/batches/:id", Component: ReviewProbe },
    ],
    { initialEntries: ["/app/batches/new"] },
  );

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

function csvFile(content: string, name = "products.csv", type = "text/csv"): File {
  return new File([content], name, { type });
}

describe("BatchUploadPage", () => {
  it("shows the mapping card disabled with a hint before a file is chosen", () => {
    renderPage();
    expect(screen.getByText("Upload a file to map its columns.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start batch classification" })).toBeDisabled();
  });

  it("parses a valid CSV, auto-matches columns, and enables Start once mapped", async () => {
    const user = userEvent.setup();
    renderPage();

    const file = csvFile("description,sku\nBlue widget,W-1\nRed widget,W-2");
    const input = screen.getByLabelText(/drop a csv here|choose a file/i, {
      selector: "input",
    });
    await user.upload(input, file);

    await waitFor(() => expect(screen.getByText("2 of 2 required")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Start batch classification" })).toBeEnabled();
  });

  it("rejects a non-CSV file", async () => {
    // applyAccept: false - a real drag-and-drop bypasses the input's `accept`
    // filter, so this exercises the page's own validation, not userEvent's
    // simulation of the browser's file picker filtering.
    const user = userEvent.setup({ applyAccept: false });
    renderPage();

    const file = csvFile("not a csv", "notes.txt", "text/plain");
    const input = screen.getByLabelText(/drop a csv here|choose a file/i, {
      selector: "input",
    });
    await user.upload(input, file);

    expect(await screen.findByText("Choose a CSV file.")).toBeInTheDocument();
    expect(screen.queryByText(/of 2 required/)).not.toBeInTheDocument();
  });

  it("rejects a file over 5 MB", async () => {
    const user = userEvent.setup();
    renderPage();

    const bigContent = `description\n${"x".repeat(6 * 1024 * 1024)}`;
    const file = csvFile(bigContent);
    const input = screen.getByLabelText(/drop a csv here|choose a file/i, {
      selector: "input",
    });
    await user.upload(input, file);

    expect(await screen.findByText("This file is larger than 5 MB.")).toBeInTheDocument();
  });

  it("rejects a CSV with more than 500 rows", async () => {
    const user = userEvent.setup();
    renderPage();

    const rows = Array.from({ length: 501 }, (_, index) => `Widget ${index},W-${index}`);
    const file = csvFile(`description,sku\n${rows.join("\n")}`);
    const input = screen.getByLabelText(/drop a csv here|choose a file/i, {
      selector: "input",
    });
    await user.upload(input, file);

    expect(await screen.findByText("This file has more than 500 rows.")).toBeInTheDocument();
  });

  it("the dropzone input and Choose file button are both keyboard reachable", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.tab();
    const input = screen.getByLabelText(/drop a csv here|choose a file/i, {
      selector: "input",
    });
    expect(input).toHaveAccessibleName();

    const chooseButton = screen.getByRole("button", { name: "Choose file" });
    await user.tab();
    expect(chooseButton).toHaveFocus();
  });
});
