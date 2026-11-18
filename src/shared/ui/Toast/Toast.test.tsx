import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider } from "./ToastProvider";
import { useToast } from "./useToast";

// Real timers throughout this file: fake timers combined with userEvent hang
// indefinitely here (confirmed by running vitest directly — every test times
// out at the wall-clock 5s limit, even the simplest one with no explicit
// advanceTimersByTime call), so instead the provider's normal 3000/6000ms
// durations are overridden down to a few tens of ms for these tests only.
// Production never passes durationMs, so real behavior is unchanged.
// Generous margins (not a few tens of ms) so this stays reliable under a
// full, loaded test run, not just in isolation.
const SHORT_DURATIONS = { default: 150, withAction: 400 };

function Harness() {
  const { show } = useToast();
  return (
    <div>
      <button onClick={() => show("HS code copied")}>Show info</button>
      <button onClick={() => show("Classification approved", { tone: "success" })}>
        Show success
      </button>
      <button
        onClick={() =>
          show("Classification deleted", {
            action: { label: "Undo", onClick: vi.fn() },
            onTimeout: vi.fn(),
          })
        }
      >
        Show with action
      </button>
    </div>
  );
}

function renderHarness() {
  return render(
    <ToastProvider durationMs={SHORT_DURATIONS}>
      <Harness />
    </ToastProvider>,
  );
}

describe("Toast", () => {
  it("shows the message in a role=status region", async () => {
    const user = userEvent.setup();
    renderHarness();

    await user.click(screen.getByRole("button", { name: "Show info" }));

    expect(screen.getByRole("status")).toHaveTextContent("HS code copied");
  });

  it("dismisses after the default duration with no action", async () => {
    const user = userEvent.setup();
    renderHarness();

    await user.click(screen.getByRole("button", { name: "Show info" }));
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
  });

  it("dismisses after the action duration, not the default, when it carries an action", async () => {
    const user = userEvent.setup();
    renderHarness();

    await user.click(screen.getByRole("button", { name: "Show with action" }));
    // Still present past the plain default duration...
    await new Promise((resolve) => setTimeout(resolve, SHORT_DURATIONS.default + 50));
    expect(screen.getByRole("status")).toBeInTheDocument();

    // ...but gone by the longer action duration.
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
  });

  it("calls onTimeout when it dismisses by its own timer", async () => {
    const onTimeout = vi.fn();
    function TimeoutHarness() {
      const { show } = useToast();
      return (
        <button
          onClick={() =>
            show("Classification deleted", {
              action: { label: "Undo", onClick: vi.fn() },
              onTimeout,
            })
          }
        >
          Show
        </button>
      );
    }
    const user = userEvent.setup();
    render(
      <ToastProvider durationMs={SHORT_DURATIONS}>
        <TimeoutHarness />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Show" }));
    await waitFor(() => expect(onTimeout).toHaveBeenCalledTimes(1));
  });

  it("calls the action's onClick and dismisses without calling onTimeout when the action is clicked", async () => {
    const onTimeout = vi.fn();
    const onActionClick = vi.fn();
    function ActionHarness() {
      const { show } = useToast();
      return (
        <button
          onClick={() =>
            show("Classification deleted", {
              action: { label: "Undo", onClick: onActionClick },
              onTimeout,
            })
          }
        >
          Show
        </button>
      );
    }
    const user = userEvent.setup();
    render(
      <ToastProvider durationMs={SHORT_DURATIONS}>
        <ActionHarness />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Show" }));
    await user.click(await screen.findByRole("button", { name: "Undo" }));

    expect(onActionClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    // Give the (cancelled) timer a chance to have fired if it hadn't been
    // cancelled, to prove onTimeout really is suppressed, not just not-yet-called.
    await new Promise((resolve) => setTimeout(resolve, SHORT_DURATIONS.withAction + 200));
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it("pauses the timer on hover and resumes on leave", async () => {
    const user = userEvent.setup();
    renderHarness();

    await user.click(screen.getByRole("button", { name: "Show info" }));
    const toast = screen.getByRole("status");

    await user.hover(toast);
    // Stay hovered well past the default duration — it must not dismiss.
    await new Promise((resolve) => setTimeout(resolve, SHORT_DURATIONS.default + 100));
    expect(screen.getByRole("status")).toBeInTheDocument();

    await user.unhover(toast);
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
  });

  it("flushes pending onTimeout callbacks immediately when the tab hides", async () => {
    const onTimeout = vi.fn();
    function HiddenHarness() {
      const { show } = useToast();
      return (
        <button
          onClick={() =>
            show("Classification deleted", {
              action: { label: "Undo", onClick: vi.fn() },
              onTimeout,
            })
          }
        >
          Show
        </button>
      );
    }
    const user = userEvent.setup();
    render(
      <ToastProvider durationMs={SHORT_DURATIONS}>
        <HiddenHarness />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Show" }));
    Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));

    await waitFor(() => expect(onTimeout).toHaveBeenCalledTimes(1));
  });
});
