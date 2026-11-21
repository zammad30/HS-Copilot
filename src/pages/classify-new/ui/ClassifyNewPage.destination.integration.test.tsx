import { afterEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router";
import { http } from "@/shared/api";
import { ClassifyNewPage } from "./ClassifyNewPage";

// Goes through the real mock API (MSW), so it proves the page never writes the
// workspace default. The default is restored afterwards: the mock store is
// shared across test files.
afterEach(async () => {
  await http.patch("/workspace", { defaultJurisdiction: "US_HTS" });
});

describe("ClassifyNewPage - destination against the mock API", () => {
  it("starts on the workspace default and changing it leaves the workspace default alone", async () => {
    await http.patch("/workspace", { defaultJurisdiction: "CA_CCT" });
    const user = userEvent.setup();
    const router = createMemoryRouter([{ path: "/app/classify/new", Component: ClassifyNewPage }], {
      initialEntries: ["/app/classify/new"],
    });
    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );

    const select = screen.getByLabelText("Destination");
    await waitFor(() => expect(select).toHaveValue("CA_CCT"));

    await user.selectOptions(select, "TR_GTIP");
    await user.type(screen.getByLabelText("Product description"), "Cotton T-shirt");
    await user.click(screen.getByRole("button", { name: "Research HS codes" }));
    await waitFor(() => expect(router.state.location.search).toContain("run="));

    const workspace = await http.get<{ defaultJurisdiction: string }>("/workspace");
    expect(workspace.defaultJurisdiction).toBe("CA_CCT");
  });
});
