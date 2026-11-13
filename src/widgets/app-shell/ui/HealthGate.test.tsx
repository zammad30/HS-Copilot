import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { HealthGate } from "./HealthGate";
import { useHealthCheck } from "../api/health.query";

vi.mock("../api/health.query", () => ({ useHealthCheck: vi.fn() }));

const mockedUseHealthCheck = vi.mocked(useHealthCheck);

describe("HealthGate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("renders nothing for the first ~800ms while pending", () => {
    mockedUseHealthCheck.mockReturnValue({
      isPending: true,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useHealthCheck>);

    const { container } = render(
      <HealthGate>
        <div>App content</div>
      </HealthGate>,
    );

    act(() => {
      vi.advanceTimersByTime(700);
    });
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the waking screen once pending has lasted past 800ms", () => {
    mockedUseHealthCheck.mockReturnValue({
      isPending: true,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useHealthCheck>);

    render(
      <HealthGate>
        <div>App content</div>
      </HealthGate>,
    );

    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(screen.getByRole("heading", { level: 1, name: "Server waking up" })).toBeInTheDocument();
  });

  it("shows the error screen once retries are exhausted, and Try again calls refetch", () => {
    const refetch = vi.fn();
    mockedUseHealthCheck.mockReturnValue({
      isPending: false,
      isError: true,
      refetch,
    } as unknown as ReturnType<typeof useHealthCheck>);

    render(
      <HealthGate>
        <div>App content</div>
      </HealthGate>,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "We couldn’t load this workspace" }),
    ).toBeInTheDocument();
    screen.getByRole("button", { name: "Try again" }).click();
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("renders children once the health check succeeds", () => {
    mockedUseHealthCheck.mockReturnValue({
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useHealthCheck>);

    render(
      <HealthGate>
        <div>App content</div>
      </HealthGate>,
    );

    expect(screen.getByText("App content")).toBeInTheDocument();
  });
});
