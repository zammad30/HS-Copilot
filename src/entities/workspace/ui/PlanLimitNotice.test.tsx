import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { PlanLimitNotice } from "./PlanLimitNotice";

function renderNotice(props: { message: string; id?: string }) {
  return render(
    <MemoryRouter>
      <PlanLimitNotice {...props} />
    </MemoryRouter>,
  );
}

describe("PlanLimitNotice", () => {
  it("shows the message and a link to the pricing page", () => {
    renderNotice({ message: "Your plan allows 5 people." });

    expect(screen.getByRole("status")).toHaveTextContent("Your plan allows 5 people.");
    expect(screen.getByRole("link", { name: "See plans" })).toHaveAttribute("href", "/pricing");
  });

  it("is not dismissible", () => {
    renderNotice({ message: "Not included." });

    expect(screen.queryByRole("button", { name: "Dismiss" })).not.toBeInTheDocument();
  });

  it("passes the id through so a control can reference it", () => {
    renderNotice({ message: "Not included.", id: "notice-1" });

    expect(screen.getByRole("status")).toHaveAttribute("id", "notice-1");
  });
});
