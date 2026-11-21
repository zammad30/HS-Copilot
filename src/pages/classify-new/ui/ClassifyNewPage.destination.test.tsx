import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router";
import { useWorkspace } from "@/entities/workspace";
import { ClassifyNewPage } from "./ClassifyNewPage";
import { useCreateClassification } from "../api/useCreateClassification";
import { useAgentRun } from "../api/agentRuns.query";
import { useAnswerClarification } from "../api/useAnswerClarification";

vi.mock("@/entities/workspace", () => ({ useWorkspace: vi.fn() }));
vi.mock("../api/useCreateClassification", () => ({ useCreateClassification: vi.fn() }));
vi.mock("../api/agentRuns.query", () => ({ useAgentRun: vi.fn() }));
vi.mock("../api/useAnswerClarification", () => ({ useAnswerClarification: vi.fn() }));

const mockedUseWorkspace = vi.mocked(useWorkspace);
const mutate = vi.fn();

function mockWorkspace(state: { defaultJurisdiction?: string; isError?: boolean }) {
  mockedUseWorkspace.mockReturnValue({
    data: state.defaultJurisdiction
      ? { defaultJurisdiction: state.defaultJurisdiction }
      : undefined,
    isError: state.isError ?? false,
    isPending: !state.defaultJurisdiction && !state.isError,
  } as unknown as ReturnType<typeof useWorkspace>);
}

beforeEach(() => {
  mutate.mockReset();
  vi.mocked(useCreateClassification).mockReturnValue({
    mutate,
    isPending: false,
  } as unknown as ReturnType<typeof useCreateClassification>);
  vi.mocked(useAgentRun).mockReturnValue({
    data: undefined,
    isError: false,
    error: null,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useAgentRun>);
  vi.mocked(useAnswerClarification).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useAnswerClarification>);
});

function renderPage() {
  const queryClient = new QueryClient();
  const router = createMemoryRouter([{ path: "/app/classify/new", Component: ClassifyNewPage }], {
    initialEntries: ["/app/classify/new"],
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe("ClassifyNewPage - destination", () => {
  it("offers the six destinations in order, with no empty option", () => {
    mockWorkspace({ defaultJurisdiction: "US_HTS" });
    renderPage();

    const select = screen.getByLabelText("Destination");
    expect(
      within(select)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual([
      "United States",
      "European Union",
      "United Kingdom",
      "Canada",
      "Australia",
      "Turkey",
    ]);
  });

  it("starts on the workspace default destination", () => {
    mockWorkspace({ defaultJurisdiction: "CA_CCT" });
    renderPage();

    expect(screen.getByLabelText("Destination")).toHaveValue("CA_CCT");
  });

  it("starts on United States while the workspace is loading", () => {
    mockWorkspace({});
    renderPage();

    expect(screen.getByLabelText("Destination")).toHaveValue("US_HTS");
  });

  it("falls back to United States when the workspace fails, without blocking the form", async () => {
    mockWorkspace({ isError: true });
    const user = userEvent.setup();
    renderPage();

    expect(screen.getByLabelText("Destination")).toHaveValue("US_HTS");
    await user.type(screen.getByLabelText("Product description"), "Cotton T-shirt");
    await user.click(screen.getByRole("button", { name: "Research HS codes" }));
    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate.mock.calls[0][0]).toMatchObject({ jurisdiction: "US_HTS" });
  });

  it("sends the chosen destination as jurisdiction, and the origin stays optional", async () => {
    mockWorkspace({ defaultJurisdiction: "US_HTS" });
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText("Product description"), "Cotton T-shirt");
    await user.selectOptions(screen.getByLabelText("Destination"), "TR_GTIP");
    await user.click(screen.getByRole("button", { name: "Research HS codes" }));

    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate.mock.calls[0][0]).toEqual({
      description: "Cotton T-shirt",
      attributes: { material: undefined, intendedUse: undefined, origin: undefined },
      jurisdiction: "TR_GTIP",
    });
  });

  it("keeps the user's choice when the workspace default arrives later", async () => {
    mockWorkspace({});
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(screen.getByLabelText("Destination"), "AU_WT");
    mockWorkspace({ defaultJurisdiction: "EU_CN" });
    // Typing re-renders the page, which now sees the loaded workspace.
    await user.type(screen.getByLabelText("Product description"), "x");

    expect(screen.getByLabelText("Destination")).toHaveValue("AU_WT");
  });

  it("still sends a chosen origin, unchanged", async () => {
    mockWorkspace({ defaultJurisdiction: "US_HTS" });
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText("Product description"), "Cotton T-shirt");
    await user.selectOptions(screen.getByLabelText("Country of origin (optional)"), "Vietnam");
    await user.click(screen.getByRole("button", { name: "Research HS codes" }));

    expect(mutate.mock.calls[0][0]).toMatchObject({ attributes: { origin: "Vietnam" } });
  });

  it("labels the origin as optional and places Destination above it", () => {
    mockWorkspace({ defaultJurisdiction: "US_HTS" });
    renderPage();

    const destination = screen.getByLabelText("Destination");
    const origin = screen.getByLabelText("Country of origin (optional)");
    expect(
      destination.compareDocumentPosition(origin) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(within(origin).getByRole("option", { name: "Unknown" })).toBeInTheDocument();
  });
});
