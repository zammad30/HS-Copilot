import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { NotFoundPage } from "./NotFoundPage";

function renderNotFoundPage() {
  return render(
    <MemoryRouter initialEntries={["/does-not-exist"]}>
      <Routes>
        <Route path="*" element={<NotFoundPage />} />
        <Route path="/" element={<div>Landing reached</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("NotFoundPage", () => {
  it("renders the 404 message with the public shell chrome", () => {
    renderNotFoundPage();
    expect(screen.getByRole("heading", { level: 1, name: "Page not found" })).toBeInTheDocument();
    expect(
      screen.getByText("The link may be outdated or the page may have moved."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByText("AI-assisted research. Human-reviewed decisions.")).toBeInTheDocument();
  });

  it("sets the document title", () => {
    renderNotFoundPage();
    expect(document.title).toBe("Page not found | HS Copilot");
  });

  it("navigates home via the Back home link, with no redirect", async () => {
    const user = userEvent.setup();
    renderNotFoundPage();

    const backHome = screen.getByRole("link", { name: "Back home" });
    expect(backHome).toHaveAttribute("href", "/");
    await user.click(backHome);
    expect(screen.getByText("Landing reached")).toBeInTheDocument();
  });
});
