import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorState } from "./ErrorState";

describe("ErrorState", () => {
  it("renders as an alert with the title and description", () => {
    render(
      <ErrorState
        title="We couldn't load the research progress"
        description="Something went wrong."
      />,
    );
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("We couldn't load the research progress");
    expect(alert).toHaveTextContent("Something went wrong.");
  });

  it("calls onRetry when the retry button is clicked", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(<ErrorState title="We couldn't load the research progress" onRetry={onRetry} />);

    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("supports a custom retry label", () => {
    render(<ErrorState title="Error" onRetry={() => {}} retryLabel="Retry now" />);
    expect(screen.getByRole("button", { name: "Retry now" })).toBeInTheDocument();
  });

  it("renders no retry button when onRetry is not given", () => {
    render(<ErrorState title="We couldn't load the research progress" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders a custom action instead of or alongside retry", () => {
    render(
      <ErrorState title="Run not found" action={<a href="/app/classify/new">Start again</a>} />,
    );
    expect(screen.getByRole("link", { name: "Start again" })).toBeInTheDocument();
  });
});
