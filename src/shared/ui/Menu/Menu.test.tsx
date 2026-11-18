import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { IconButton } from "@/shared/ui/IconButton";
import { Settings } from "lucide-react";
import { Menu } from "./Menu";

function renderMenu(items: Parameters<typeof Menu>[0]["items"], extra = {}) {
  return render(
    <MemoryRouter>
      <Menu
        trigger={<IconButton icon={<Settings />} aria-label="Open menu" />}
        items={items}
        {...extra}
      />
    </MemoryRouter>,
  );
}

describe("Menu", () => {
  it("opens on Enter and focuses the first item", async () => {
    // Radix only auto-focuses the first item on a keyboard open — a mouse
    // open focuses the menu container instead — so open via the keyboard here.
    const user = userEvent.setup();
    renderMenu([{ label: "Account settings", onSelect: vi.fn() }]);

    const trigger = screen.getByRole("button", { name: "Open menu" });
    trigger.focus();
    await user.keyboard("{Enter}");

    const item = await screen.findByRole("menuitem", { name: "Account settings" });
    expect(item).toHaveFocus();
  });

  it("calls onSelect when an item is activated and closes the menu", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderMenu([{ label: "Sign out", onSelect }]);

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await user.click(await screen.findByRole("menuitem", { name: "Sign out" }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menuitem", { name: "Sign out" })).not.toBeInTheDocument();
  });

  it("moves focus between items with the arrow keys", async () => {
    // Opened via the keyboard for the same reason as above — a mouse open
    // wouldn't put focus on "First" to begin with.
    const user = userEvent.setup();
    renderMenu([
      { label: "First", onSelect: vi.fn() },
      { label: "Second", onSelect: vi.fn() },
    ]);

    const trigger = screen.getByRole("button", { name: "Open menu" });
    trigger.focus();
    await user.keyboard("{Enter}");
    await screen.findByRole("menuitem", { name: "First" });

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Second" })).toHaveFocus();
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    renderMenu([{ label: "Item", onSelect: vi.fn() }]);

    const trigger = screen.getByRole("button", { name: "Open menu" });
    await user.click(trigger);
    await screen.findByRole("menuitem", { name: "Item" });

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("menuitem", { name: "Item" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("navigates for an href item", async () => {
    const user = userEvent.setup();
    renderMenu([{ label: "How classification works", href: "/methodology" }]);

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    const link = await screen.findByRole("menuitem", { name: "How classification works" });
    expect(link.tagName.toLowerCase()).toBe("a");
    expect(link).toHaveAttribute("href", "/methodology");
  });
});
