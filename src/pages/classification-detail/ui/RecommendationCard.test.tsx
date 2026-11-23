import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Classification, Evidence } from "@/entities/classification";
import { ToastProvider } from "@/shared/ui/Toast";
import { RecommendationCard } from "./RecommendationCard";

const EVIDENCE: Evidence[] = [
  {
    kind: "tariff_text",
    title: "HTS heading 9617",
    reference: "HTS heading 9617",
    excerpt: "Vacuum vessels described by material and construction.",
  },
  {
    kind: "tariff_text",
    title: "GRI 1 and 6",
    reference: "GRI 1 and 6",
    excerpt: "General Rules of Interpretation 1 and 6 govern classification.",
  },
  {
    kind: "ruling",
    title: "Vacuum vessels ruling",
    reference: "HQ961700-26",
    excerpt: "A materially similar vessel was classified under 9617.00.",
    isSample: true,
  },
];

function makeClassification(): Classification {
  return {
    id: "cls_003",
    workspaceId: "workspace_1",
    description: "Stainless steel vacuum insulated bottle, 750 ml",
    attributes: {},
    jurisdiction: "US_HTS",
    suggestedCode: "9617.00",
    overridden: false,
    confidence: 94,
    status: "approved",
    candidates: [],
    evidence: EVIDENCE,
    auditTrail: [],
    createdAt: "2026-11-01T00:00:00.000Z",
    updatedAt: "2026-11-01T00:00:00.000Z",
    createdBy: "reviewer@hs-copilot.test",
    expiresAt: "2027-11-01T00:00:00.000Z",
  };
}

describe("RecommendationCard - citation chips", () => {
  it("renders one chip per evidence item, including a second tariff_text entry that the evidence grid below only shows one of", () => {
    render(<RecommendationCard classification={makeClassification()} onOpenEvidence={vi.fn()} />);

    expect(screen.getByRole("button", { name: /HTS heading 9617/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /GRI 1 and 6/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /HQ961700-26/ })).toBeInTheDocument();
  });

  it("every chip opens the drawer with its own full evidence item, not just the first of its kind", async () => {
    const onOpenEvidence = vi.fn();
    const user = userEvent.setup();
    render(
      <RecommendationCard classification={makeClassification()} onOpenEvidence={onOpenEvidence} />,
    );

    await user.click(screen.getByRole("button", { name: /GRI 1 and 6/ }));

    expect(onOpenEvidence).toHaveBeenCalledTimes(1);
    expect(onOpenEvidence.mock.calls[0][0]).toMatchObject({ reference: "GRI 1 and 6" });
    expect(onOpenEvidence.mock.calls[0][1]).toBeInstanceOf(HTMLButtonElement);
  });
});

describe("RecommendationCard - copy code", () => {
  it("copies the effective code and shows the toast, using the overridden code when overridden", async () => {
    const user = userEvent.setup();
    const writeTextSpy = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
    render(
      <ToastProvider>
        <RecommendationCard
          classification={{
            ...makeClassification(),
            overridden: true,
            finalCode: "9617.10",
          }}
          onOpenEvidence={vi.fn()}
        />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Copy code" }));

    expect(writeTextSpy).toHaveBeenCalledWith("9617.10");
    expect(await screen.findByRole("status")).toHaveTextContent("HS code copied");
  });
});
