import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrintHistory } from "./PrintHistory";

function renderHistory(id: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <PrintHistory classificationId={id} />
    </QueryClientProvider>,
  );
}

describe("PrintHistory", () => {
  it("shows the full date with the year and the time on every entry", async () => {
    renderHistory("cls_008");

    const section = await screen.findByLabelText("Decision history", {}, { timeout: 5000 });
    await waitFor(() => expect(section.querySelectorAll("li").length).toBeGreaterThan(0));

    const items = Array.from(section.querySelectorAll("li"));
    for (const item of items) {
      const time = item.querySelector("span")?.textContent ?? "";
      // e.g. "Nov 23, 2026, 8:22 PM": a month, a four-digit year and a clock time.
      expect(time).toMatch(/[A-Za-z]{3,}\.? \d{1,2}, \d{4}/);
      expect(time).toMatch(/\d{1,2}:\d{2}/);
    }
  }, 15000);
});
