import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AgentSteps } from "./AgentSteps";
import type { AgentRunStep } from "../model/agentRun.schema";

const STEPS: AgentRunStep[] = [
  { id: "extract", title: "Extract product attributes", detail: "A cotton T-shirt", state: "done" },
  {
    id: "search",
    title: "Search tariff headings",
    detail: "Compared candidate headings based on material, construction, and use.",
    state: "active",
  },
  { id: "notes", title: "Apply heading notes", detail: "Waiting", state: "waiting" },
  { id: "rank", title: "Rank candidates", detail: "Waiting", state: "waiting" },
];

describe("AgentSteps", () => {
  it("renders every step's title and detail", () => {
    render(<AgentSteps steps={STEPS} />);
    expect(screen.getByText("Extract product attributes")).toBeInTheDocument();
    expect(screen.getByText("A cotton T-shirt")).toBeInTheDocument();
    expect(screen.getAllByText("Search tariff headings").length).toBeGreaterThan(0);
    expect(
      screen.getByText("Compared candidate headings based on material, construction, and use."),
    ).toBeInTheDocument();
  });

  it("announces the active step title in an aria-live region", () => {
    render(<AgentSteps steps={STEPS} />);
    const liveRegions = screen.getAllByText("Search tariff headings");
    expect(liveRegions.length).toBeGreaterThan(1);
  });

  it("announces nothing when no step is active or paused", () => {
    const doneSteps = STEPS.map((step) => ({ ...step, state: "done" as const }));
    const { container } = render(<AgentSteps steps={doneSteps} />);
    const liveRegion = container.querySelector('[aria-live="polite"]');
    expect(liveRegion).toHaveTextContent("");
  });
});
