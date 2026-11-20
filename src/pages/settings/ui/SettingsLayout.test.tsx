import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { SettingsLayout } from "./SettingsLayout";

function renderLayout(initialEntry: string) {
  const router = createMemoryRouter(
    [
      {
        Component: SettingsLayout,
        children: [
          { path: "/app/settings/general", Component: () => <p>General content</p> },
          { path: "/app/settings/members", Component: () => <p>Members content</p> },
          { path: "/app/settings/rules", Component: () => <p>Rules content</p> },
        ],
      },
    ],
    { initialEntries: [initialEntry] },
  );
  return render(<RouterProvider router={router} />);
}

describe("SettingsLayout", () => {
  it("renders the page header and the active tab's content", () => {
    renderLayout("/app/settings/members");
    expect(screen.getByRole("heading", { level: 1, name: "Settings & team" })).toBeInTheDocument();
    expect(screen.getByText("Members content")).toBeInTheDocument();
  });

  it("marks the active nav link with aria-current", () => {
    renderLayout("/app/settings/general");
    expect(screen.getByRole("link", { name: "General" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Members" })).not.toHaveAttribute("aria-current");
  });
});
