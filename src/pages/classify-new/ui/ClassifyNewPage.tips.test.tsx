import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router";
import { ClassifyNewPage } from "./ClassifyNewPage";

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter([{ path: "/app/classify/new", Component: ClassifyNewPage }], {
    initialEntries: ["/app/classify/new"],
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe("ClassifyNewPage - tips", () => {
  it("shows the four tips once, as a list titled 'Tips for a better result'", () => {
    renderPage();

    expect(screen.getAllByText("Tips for a better result")).toHaveLength(1);
    const list = screen.getByRole("list", { name: "Tips for a better result" });
    const items = within(list).getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual([
      "Say what it is made of.",
      "Say what it does or how it is used.",
      "Add size, form or state, such as frozen, assembled or sold in sets.",
      "Leave out brand names and marketing words.",
    ]);
  });

  it("does not add to the description field's accessible description", () => {
    renderPage();

    expect(screen.getByLabelText("Product description")).not.toHaveAttribute("aria-describedby");
  });
});
