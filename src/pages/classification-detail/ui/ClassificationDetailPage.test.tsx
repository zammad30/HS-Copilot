import { describe, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router";
import { ToastProvider } from "@/shared/ui/Toast";
import { ClassificationDetailPage } from "./ClassificationDetailPage";

function renderPage(initialEntry: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const router = createMemoryRouter(
    [{ path: "/app/classifications/:id", Component: ClassificationDetailPage }],
    { initialEntries: [initialEntry] },
  );

  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider durationMs={{ default: 300, withAction: 800 }}>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe("ClassificationDetailPage - loading and errors", () => {
  it("shows a loading skeleton before the data arrives", () => {
    renderPage("/app/classifications/cls_002");
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
  });

  it("shows the not-found state for an unknown id, with a working Back to library action", async () => {
    renderPage("/app/classifications/does-not-exist");

    expect(await screen.findByText("Classification not found")).toBeInTheDocument();
    expect(screen.getByText("It may have been deleted.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to library" })).toBeInTheDocument();
  });

  it("shows an error state with a working Try again for a non-404 failure", async () => {
    // Uses the documented ?forceError test hook (see docs/api-contract.md /
    // app/mocks/scenarios.ts), encoded into the path param so it travels with
    // the request without this page-layer test importing the app-layer MSW
    // server directly.
    const user = userEvent.setup();
    renderPage("/app/classifications/cls_002%3FforceError%3Dserver_error");

    expect(
      await screen.findByText("We couldn't load this classification", {}, { timeout: 5000 }),
    ).toBeInTheDocument();
    const retry = screen.getByRole("button", { name: "Try again" });
    await user.click(retry);
    expect(
      await screen.findByText("We couldn't load this classification", {}, { timeout: 5000 }),
    ).toBeInTheDocument();
  });
});

describe("ClassificationDetailPage - approve and undo", () => {
  it("approve shows a success toast with an Undo action, and undo restores the previous status", async () => {
    const user = userEvent.setup();
    renderPage("/app/classifications/cls_008");

    await screen.findByRole("heading", {
      level: 1,
      name: "Women's textile running shoes with rubber sole",
    });
    await user.click(screen.getByRole("button", { name: /Approve 6404\.11/ }));

    const toast = await screen.findByRole("status", {}, { timeout: 5000 });
    expect(toast).toHaveTextContent("Classification approved");
    await user.click(within(toast).getByRole("button", { name: "Undo" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Approve 6404\.11/ })).toBeInTheDocument(),
    );
  }, 15000);
});

describe("ClassificationDetailPage - reject", () => {
  it("requires a reason, then rejects and shows a success toast; focus returns to Reject on cancel", async () => {
    const user = userEvent.setup();
    renderPage("/app/classifications/cls_011");

    await screen.findByRole("heading", {
      level: 1,
      name: "Stackable polypropylene storage bins with lids",
    });
    const rejectButton = screen.getByRole("button", { name: "Reject" });
    await user.click(rejectButton);

    const dialog = await screen.findByRole("dialog", { name: "Reject classification" });
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(rejectButton).toHaveFocus();

    await user.click(rejectButton);
    const reopened = await screen.findByRole("dialog", { name: "Reject classification" });
    await user.click(within(reopened).getByRole("button", { name: "Reject" }));
    expect(
      screen.getByText("Enter a reason for rejecting this classification."),
    ).toBeInTheDocument();

    await user.type(within(reopened).getByLabelText("Reason"), "Does not match the heading.");
    await user.click(within(reopened).getByRole("button", { name: "Reject" }));

    const toast = await screen.findByRole("status", {}, { timeout: 5000 });
    expect(toast).toHaveTextContent("Classification rejected");
  }, 15000);
});

describe("ClassificationDetailPage - override", () => {
  it("requires a valid, different code and a reason, then overrides and shows both status indicators", async () => {
    const user = userEvent.setup();
    renderPage("/app/classifications/cls_013");

    await screen.findByRole("heading", {
      level: 1,
      name: "Moulded silicone smartphone protective case",
    });
    const overrideButton = screen.getByRole("button", { name: "Override code" });
    await user.click(overrideButton);

    const dialog = await screen.findByRole("dialog", { name: "Override classification code" });
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(overrideButton).toHaveFocus();

    await user.click(overrideButton);
    const reopened = await screen.findByRole("dialog", { name: "Override classification code" });
    const select = within(reopened).getByLabelText("HS code") as HTMLSelectElement;
    expect(select.value).toBe("3926.90");
    expect(
      within(reopened)
        .getAllByRole("option")
        .map((option) => option.getAttribute("value")),
    ).toContain("4202.32");

    await user.click(within(reopened).getByRole("button", { name: "Confirm override" }));
    expect(screen.getByText("Choose a different code than the current one.")).toBeInTheDocument();

    await user.selectOptions(select, "4202.32");
    await user.type(
      within(reopened).getByLabelText("Reason for override"),
      "Better matches the product's principal use.",
    );
    await user.click(within(reopened).getByRole("button", { name: "Confirm override" }));

    const toast = await screen.findByRole("status", {}, { timeout: 5000 });
    expect(toast).toHaveTextContent("Classification overridden");
    expect(await screen.findByText("Overridden", {}, { timeout: 5000 })).toBeInTheDocument();
  }, 15000);
});

describe("ClassificationDetailPage - ask for more information", () => {
  it("requires an assignee, then sends the request and shows a success toast", async () => {
    const user = userEvent.setup();
    renderPage("/app/classifications/cls_002");

    await screen.findByRole("heading", {
      level: 1,
      name: "Wireless Bluetooth earbuds with charging case",
    });
    await user.click(screen.getByRole("button", { name: "Ask for more info" }));

    const dialog = await screen.findByRole("dialog", { name: "Ask for more information" });
    await user.click(within(dialog).getByRole("button", { name: "Send request" }));
    expect(screen.getByText("Select who should follow up.")).toBeInTheDocument();

    // The select always has a placeholder option even before members load,
    // so wait for the real assignee options, not just any option.
    await waitFor(() => {
      expect(within(dialog).getAllByRole("option").length).toBeGreaterThan(1);
    });
    const assignees = within(dialog).getAllByRole("option");
    await user.selectOptions(
      within(dialog).getByLabelText("Assign to"),
      assignees[1].getAttribute("value") ?? "",
    );
    await user.click(within(dialog).getByRole("button", { name: "Send request" }));

    const toast = await screen.findByRole("status", {}, { timeout: 5000 });
    expect(toast).toHaveTextContent("Information request sent");
  }, 15000);
});

describe("ClassificationDetailPage - audit trail drawer", () => {
  it("opens the drawer and returns focus to the Audit trail button on close", async () => {
    const user = userEvent.setup();
    renderPage("/app/classifications/cls_003");

    await screen.findByRole("heading", {
      level: 1,
      name: "Stainless steel vacuum insulated bottle, 750 ml",
    });
    const auditButton = screen.getByRole("button", { name: "Audit trail" });
    await user.click(auditButton);

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Jurisdiction")).toBeInTheDocument();
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(auditButton).toHaveFocus();
  });
});

describe("ClassificationDetailPage - citation chips", () => {
  it("opens the drawer with the full evidence for a chip whose item the evidence grid below doesn't show", async () => {
    // cls_003 has two tariff_text evidence items ("HTS heading 9617" and "GRI
    // 1 and 6") plus a ruling; the Evidence grid below only renders the first
    // tariff_text item, so "GRI 1 and 6" is reachable only via its chip.
    const user = userEvent.setup();
    renderPage("/app/classifications/cls_003");

    await screen.findByRole("heading", {
      level: 1,
      name: "Stainless steel vacuum insulated bottle, 750 ml",
    });

    expect(screen.queryByRole("button", { name: "Open source" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /GRI 1 and 6/ }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Evidence")).toBeInTheDocument();
    expect(within(dialog).getAllByText("GRI 1 and 6").length).toBeGreaterThan(0);
    expect(
      within(dialog).getByText(
        "General Rules of Interpretation 1 and 6 govern classification by heading text and subheading comparison.",
      ),
    ).toBeInTheDocument();
  });
});
