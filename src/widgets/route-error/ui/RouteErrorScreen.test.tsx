import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { RouteErrorScreen } from "./RouteErrorScreen";
import { AppNotFoundScreen } from "./AppNotFoundScreen";

afterEach(() => vi.unstubAllGlobals());

describe("RouteErrorScreen", () => {
  it("shows the fixed copy, a home link and no technical detail", () => {
    render(
      <MemoryRouter>
        <RouteErrorScreen homePath="/app" />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Something went wrong" })).toBeVisible();
    expect(
      screen.getByText("Reload the page or go back. If this keeps happening, contact support."),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Go to home" })).toHaveAttribute("href", "/app");
    expect(document.title).toBe("Something went wrong | HS Copilot");
  });

  it("moves focus to the heading when it appears", () => {
    render(
      <MemoryRouter>
        <RouteErrorScreen homePath="/" isFullPage />
      </MemoryRouter>,
    );

    const heading = screen.getByRole("heading", { level: 1, name: "Something went wrong" });
    expect(heading).toHaveAttribute("tabindex", "-1");
    expect(heading).toHaveFocus();
  });

  it("reloads the page from the Reload page button", async () => {
    const user = userEvent.setup();
    const reload = vi.fn();
    vi.stubGlobal("location", { ...window.location, reload });
    render(
      <MemoryRouter>
        <RouteErrorScreen homePath="/" />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Reload page" }));

    expect(reload).toHaveBeenCalledTimes(1);
  });
});

describe("AppNotFoundScreen", () => {
  it("shows the not-found copy, a link to the app home, a title and focuses the heading", () => {
    render(
      <MemoryRouter>
        <AppNotFoundScreen />
      </MemoryRouter>,
    );

    const heading = screen.getByRole("heading", { level: 1, name: "Page not found" });
    expect(heading).toHaveFocus();
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/app");
    expect(document.title).toBe("Page not found | HS Copilot");
  });
});
