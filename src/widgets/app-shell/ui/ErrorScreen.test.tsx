import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorScreen } from "./ErrorScreen";

describe("ErrorScreen", () => {
  it("renders the error message and calls onRetry", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorScreen onRetry={onRetry} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "We couldn’t load this workspace" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your work is safe. Clear the temporary error and try loading the demo again.",
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
