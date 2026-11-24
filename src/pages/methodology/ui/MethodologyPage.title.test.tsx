import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { MethodologyPage } from "./MethodologyPage";

describe("MethodologyPage document title", () => {
  it("sets a descriptive title", () => {
    render(
      <MemoryRouter>
        <MethodologyPage />
      </MemoryRouter>,
    );
    expect(document.title).toBe("Methodology | HS Copilot");
  });
});
