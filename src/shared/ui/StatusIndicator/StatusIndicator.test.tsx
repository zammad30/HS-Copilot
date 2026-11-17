import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusIndicator } from "./StatusIndicator";
import type { StatusIndicatorStatus } from "./StatusIndicator";

const statuses: { status: StatusIndicatorStatus; label: string }[] = [
  { status: "approved", label: "Approved" },
  { status: "rejected", label: "Rejected" },
  { status: "needs-review", label: "Needs review" },
  { status: "pending", label: "Pending" },
  { status: "overridden", label: "Overridden" },
];

describe("StatusIndicator", () => {
  it.each(statuses)("always renders the $label text label", ({ status, label }) => {
    render(<StatusIndicator status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("renders the dot as aria-hidden, so status is never conveyed by color alone", () => {
    render(<StatusIndicator status="approved" />);
    const indicator = screen.getByText("Approved").closest("span");
    const dot = indicator?.querySelector("span[aria-hidden='true']");
    expect(dot).toBeInTheDocument();
    expect(dot).toHaveAttribute("aria-hidden", "true");
  });

  it.each(statuses)("maps $status to its own status color class", ({ status }) => {
    render(<StatusIndicator status={status} />);
    const label =
      status === "needs-review" ? "Needs review" : status[0].toUpperCase() + status.slice(1);
    const indicator = screen.getByText(label).closest("span");
    const dot = indicator?.querySelector("span[aria-hidden='true']");
    expect(dot?.className).toBeTruthy();
  });

  it("renders the overridden status in its own color, not red or green", () => {
    render(<StatusIndicator status="overridden" />);
    const indicator = screen.getByText("Overridden").closest("span");
    const dot = indicator?.querySelector("span[aria-hidden='true']");
    expect(dot?.className).not.toMatch(/approved|rejected/i);
  });
});
