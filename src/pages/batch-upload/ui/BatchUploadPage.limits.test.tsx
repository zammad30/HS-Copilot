import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router";
import { delay, http as mswHttp, HttpResponse } from "msw";
import { server } from "../../../../tests/mswServer";
import { env } from "@/shared/config";
import { http } from "@/shared/api";
import { useWorkspace } from "@/entities/workspace";
import { BatchUploadPage } from "./BatchUploadPage";

interface WorkspaceOptions {
  plan?: string;
  classificationLimit?: number;
  classificationsUsed?: number;
  uploadsPerMonth?: number;
  maxRows?: number;
  batchUploadsUsed?: number;
}

function workspaceBody({
  plan = "team",
  classificationLimit = 1300,
  classificationsUsed = 3,
  uploadsPerMonth = 10,
  maxRows = 500,
  batchUploadsUsed = 0,
}: WorkspaceOptions) {
  return {
    id: "workspace_mock_1",
    name: "Sample workspace",
    defaultJurisdiction: "US_HTS",
    plan,
    limits: {
      classifications: { limit: classificationLimit, period: "month" },
      seats: 5,
      batch: { uploadsPerMonth, maxRows },
      secondApprover: true,
      auditRetentionDays: 730,
    },
    usage: {
      classificationsUsed,
      batchUploadsUsed,
      seatsUsed: 4,
      periodEnd: "2031-11-30T12:00:00",
    },
  };
}

function useWorkspaceResponses(...responses: WorkspaceOptions[]) {
  let calls = 0;
  server.use(
    mswHttp.get(`${env.apiBaseUrl}/workspace`, async () => {
      const index = Math.min(calls, responses.length - 1);
      calls += 1;
      // Later fetches are slow enough for a test to observe the state before they land.
      if (index > 0) await delay(400);
      return HttpResponse.json(workspaceBody(responses[index]));
    }),
  );
  return { getCalls: () => calls };
}

function useLimitRefusal(reason: string, limit: number, used: number) {
  server.use(
    mswHttp.post(`${env.apiBaseUrl}/batches`, () =>
      HttpResponse.json(
        {
          error: {
            code: "plan_limit_reached",
            message: "This plan has reached its limit.",
            details: { reason, limit, used },
          },
        },
        { status: 403 },
      ),
    ),
  );
}

function ReviewProbe() {
  const { data } = useWorkspace();
  return <p data-testid="used">{data?.usage.batchUploadsUsed}</p>;
}

function renderPage() {
  // Nothing goes stale on its own here, so only an explicit invalidation can refetch.
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity },
      mutations: { retry: false },
    },
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

function csvFile(rowCount: number): File {
  const rows = Array.from({ length: rowCount }, (_, index) => `Widget ${index},W-${index}`);
  return new File([`description,sku\n${rows.join("\n")}`], "products.csv", { type: "text/csv" });
}

const fileInput = () =>
  screen.getByLabelText(/drop a csv here|choose a file|products\.csv/i, { selector: "input" });
const startButton = () => screen.getByRole("button", { name: "Start batch classification" });

async function upload(user: ReturnType<typeof userEvent.setup>, rowCount: number) {
  await user.upload(fileInput(), csvFile(rowCount));
  await waitFor(() => expect(screen.getByText("2 of 2 required")).toBeInTheDocument());
}

describe("BatchUploadPage - usage and limits", () => {
  it("shows the usage lines and no notice under the limits, and the flow works", async () => {
    const user = userEvent.setup();
    renderPage();

    expect(
      await screen.findByText("Batch uploads: 0 of 10 used this month. Up to 500 rows per upload."),
    ).toBeInTheDocument();
    expect(screen.getByText(/^3 of 1,300 classifications used this month\./)).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "See plans" })).not.toBeInTheDocument();
    expect(fileInput()).toBeEnabled();

    await upload(user, 2);
    expect(startButton()).toBeEnabled();
    expect(startButton()).not.toHaveAttribute("aria-describedby");
  });

  it("blocks everything on a plan with no batch uploads", async () => {
    await http.put("/__mock/plan", { plan: "free" });
    renderPage();

    const notice = await screen.findByRole("status");
    expect(notice).toHaveTextContent("This is not included in your plan.");
    expect(screen.getByRole("link", { name: "See plans" })).toHaveAttribute("href", "/pricing");
    expect(screen.getByText("Batch uploads: not included in your plan.")).toBeInTheDocument();
    expect(fileInput()).toBeDisabled();
    expect(screen.getByRole("button", { name: "Choose file" })).toBeDisabled();
    expect(startButton()).toBeDisabled();
    expect(startButton()).toHaveAttribute("aria-describedby", notice.id);
  });

  it("blocks the chooser and submit when the month's uploads are used up", async () => {
    useWorkspaceResponses({ plan: "solo", uploadsPerMonth: 3, maxRows: 50, batchUploadsUsed: 3 });
    renderPage();

    const notice = await screen.findByRole("status");
    expect(notice).toHaveTextContent("You have used all 3 batch uploads for this month.");
    expect(screen.getByText(/^Batch uploads: 3 of 3 used this month\./)).toBeInTheDocument();
    expect(fileInput()).toBeDisabled();
    expect(screen.getByRole("button", { name: "Choose file" })).toBeDisabled();
    expect(startButton()).toBeDisabled();
    expect(startButton()).toHaveAttribute("aria-describedby", notice.id);
  });

  it("blocks submit when the file has more rows than the plan allows per upload", async () => {
    await http.put("/__mock/plan", { plan: "solo" });
    const user = userEvent.setup();
    renderPage();
    await screen.findByText(/^Batch uploads: 0 of 3 used this month\./);

    await upload(user, 51);

    const notice = await screen.findByRole("status");
    expect(notice).toHaveTextContent("Your plan allows up to 50 rows per batch upload.");
    expect(fileInput()).toBeEnabled();
    expect(startButton()).toBeDisabled();
    expect(startButton()).toHaveAttribute("aria-describedby", notice.id);
  });

  it("blocks submit when the file has more rows than the classifications left", async () => {
    useWorkspaceResponses({ classificationLimit: 5, classificationsUsed: 3 });
    const user = userEvent.setup();
    renderPage();
    await screen.findByText(/^3 of 5 classifications used this month\./);

    await upload(user, 3);

    const notice = await screen.findByRole("status");
    expect(notice).toHaveTextContent("You have used all 5 classifications in your plan.");
    expect(notice).toHaveTextContent("You have 2 left");
    expect(startButton()).toBeDisabled();
    expect(startButton()).toHaveAttribute("aria-describedby", notice.id);
  });

  it("allows a file that fits the remaining classifications exactly", async () => {
    useWorkspaceResponses({ classificationLimit: 5, classificationsUsed: 3 });
    const user = userEvent.setup();
    renderPage();
    await screen.findByText(/^3 of 5 classifications used this month\./);

    await upload(user, 2);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(startButton()).toBeEnabled();
  });

  it("keeps the form working when the workspace fails to load", async () => {
    server.use(
      mswHttp.get(`${env.apiBaseUrl}/workspace`, () =>
        HttpResponse.json({ error: { code: "server_error", message: "Boom" } }, { status: 500 }),
      ),
    );
    const user = userEvent.setup();
    renderPage();

    await upload(user, 2);

    expect(screen.queryByText(/Batch uploads:/)).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(startButton()).toBeEnabled();
  });
});

describe("BatchUploadPage - refused by the server", () => {
  it("shows the matching notice instead of the generic error, and refetches the workspace", async () => {
    const { getCalls } = useWorkspaceResponses(
      { plan: "solo", uploadsPerMonth: 3, maxRows: 50, batchUploadsUsed: 1 },
      { plan: "solo", uploadsPerMonth: 3, maxRows: 50, batchUploadsUsed: 3 },
    );
    useLimitRefusal("batch_uploads", 3, 3);
    const user = userEvent.setup();
    renderPage();
    await screen.findByText(/^Batch uploads: 1 of 3 used this month\./);
    await upload(user, 2);

    await user.click(startButton());

    expect(await screen.findByRole("status")).toHaveTextContent(
      "You have used all 3 batch uploads for this month.",
    );
    expect(screen.queryByText("We couldn't start the batch. Try again.")).not.toBeInTheDocument();
    expect(startButton()).toBeDisabled();
    await waitFor(() => expect(getCalls()).toBe(2));
    // Once the newer workspace is in, it is the workspace that decides (now used up).
    expect(await screen.findByText(/^Batch uploads: 3 of 3 used this month\./)).toBeInTheDocument();
    expect(screen.getAllByRole("status")).toHaveLength(1);
  }, 15000);

  it("clears the notice when the refetched workspace is under the limit", async () => {
    useWorkspaceResponses(
      { plan: "solo", uploadsPerMonth: 3, maxRows: 50, batchUploadsUsed: 1 },
      { plan: "solo", uploadsPerMonth: 3, maxRows: 50, batchUploadsUsed: 1 },
    );
    useLimitRefusal("batch_uploads", 3, 3);
    const user = userEvent.setup();
    renderPage();
    await screen.findByText(/^Batch uploads: 1 of 3 used this month\./);
    await upload(user, 2);
    await user.click(startButton());
    await screen.findByRole("status");

    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
    expect(startButton()).toBeEnabled();
    expect(startButton()).not.toHaveAttribute("aria-describedby");
  }, 15000);

  it("refreshes the usage after a successful upload", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Batch uploads: 0 of 10 used this month. Up to 500 rows per upload.");
    await upload(user, 2);

    await user.click(startButton());

    await waitFor(() => expect(screen.getByTestId("used")).toHaveTextContent("1"), {
      timeout: 5000,
    });
  }, 15000);
});
