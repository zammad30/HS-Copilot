import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router";
import type { AgentRun } from "../model/agentRun.schema";
import { ClassifyNewPage } from "./ClassifyNewPage";
import { useCreateClassification } from "../api/useCreateClassification";
import { useAgentRun } from "../api/agentRuns.query";
import { useAnswerClarification } from "../api/useAnswerClarification";

type MutateOptions<T> = { onSuccess?: (data: T) => void; onError?: (error: Error) => void };

vi.mock("../api/useCreateClassification", () => ({ useCreateClassification: vi.fn() }));
vi.mock("../api/agentRuns.query", () => ({ useAgentRun: vi.fn() }));
vi.mock("../api/useAnswerClarification", () => ({ useAnswerClarification: vi.fn() }));

const mockedUseCreate = vi.mocked(useCreateClassification);
const mockedUseAgentRun = vi.mocked(useAgentRun);
const mockedUseAnswer = vi.mocked(useAnswerClarification);

const PAUSED_RUN: AgentRun = {
  id: "run_1",
  classificationId: "cls_1",
  steps: [
    { id: "extract", title: "Extract product attributes", detail: "A product", state: "done" },
    { id: "search", title: "Search tariff headings", detail: "Compared headings", state: "done" },
    {
      id: "notes",
      title: "Apply heading notes",
      detail: "Paused for a clarifying detail.",
      state: "paused",
    },
    { id: "rank", title: "Rank candidates", detail: "Waiting", state: "waiting" },
  ],
  question: {
    text: "Is the product’s principal function fully described above?",
    options: [
      { label: "Yes", hint: "The description covers its primary use" },
      { label: "No", hint: "The product has another important function" },
    ],
  },
};

function renderPage(initialEntry: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const router = createMemoryRouter(
    [
      { path: "/app/classify/new", Component: ClassifyNewPage },
      { path: "/app/classifications/:id", Component: () => <p>Detail</p> },
    ],
    { initialEntries: [initialEntry] },
  );
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe("ClassifyNewPage - create failure", () => {
  it("shows an inline error, re-enables the form, and keeps the typed values", async () => {
    const mutate = vi.fn((_body: unknown, options?: MutateOptions<unknown>) =>
      options?.onError?.(new Error("mock create failure")),
    );
    mockedUseCreate.mockReturnValue({
      mutate,
      isPending: false,
    } as unknown as ReturnType<typeof useCreateClassification>);
    mockedUseAgentRun.mockReturnValue({
      data: undefined,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useAgentRun>);
    mockedUseAnswer.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useAnswerClarification>);

    const user = userEvent.setup();
    renderPage("/app/classify/new");

    const textarea = screen.getByLabelText("Product description");
    await user.type(textarea, "Men's cotton T-shirt");
    await user.click(screen.getByRole("button", { name: "Research HS codes" }));

    expect(
      await screen.findByText("We couldn't start the research. Try again."),
    ).toBeInTheDocument();
    expect(textarea).toHaveValue("Men's cotton T-shirt");
    expect(textarea).not.toBeDisabled();
  });
});

describe("ClassifyNewPage - poll failure", () => {
  it("shows ErrorState in the progress card with a working retry", async () => {
    const refetch = vi.fn();
    mockedUseCreate.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateClassification>);
    mockedUseAgentRun.mockReturnValue({
      data: undefined,
      isError: true,
      error: new Error("mock poll failure"),
      refetch,
    } as unknown as ReturnType<typeof useAgentRun>);
    mockedUseAnswer.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useAnswerClarification>);

    const user = userEvent.setup();
    renderPage("/app/classify/new?run=run_1");

    expect(await screen.findByText("We couldn't load the research progress")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});

describe("ClassifyNewPage - answer failure", () => {
  it("shows an inline error in the question block and re-enables the options", async () => {
    mockedUseCreate.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateClassification>);
    mockedUseAgentRun.mockReturnValue({
      data: PAUSED_RUN,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useAgentRun>);
    mockedUseAnswer.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: true,
    } as unknown as ReturnType<typeof useAnswerClarification>);

    renderPage("/app/classify/new?run=run_1");

    expect(await screen.findByText("We couldn't send your answer. Try again.")).toBeInTheDocument();
    for (const button of screen.getAllByRole("button", { name: /Yes|No/ })) {
      expect(button).not.toBeDisabled();
    }
  });
});
