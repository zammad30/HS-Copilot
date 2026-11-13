import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { WakingScreen } from "./WakingScreen";

describe("WakingScreen", () => {
  it("renders the cold-start message", () => {
    render(<WakingScreen />);
    expect(screen.getByRole("heading", { level: 1, name: "Server waking up" })).toBeInTheDocument();
    expect(
      screen.getByText("Preparing your workspace. This usually takes less than a minute."),
    ).toBeInTheDocument();
  });
});
