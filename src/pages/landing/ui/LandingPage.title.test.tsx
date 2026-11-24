import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { LandingPage } from "./LandingPage";

describe("LandingPage document title", () => {
  it("sets a descriptive title", () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );
    expect(document.title).toBe("HS Copilot | Classify products with evidence");
  });
});
