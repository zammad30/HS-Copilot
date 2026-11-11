import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDocumentTitle } from "./useDocumentTitle";

describe("useDocumentTitle", () => {
  it("sets the document title and restores the previous one on unmount", () => {
    document.title = "Original title";

    const { unmount } = renderHook(() => useDocumentTitle("New title"));
    expect(document.title).toBe("New title");

    unmount();
    expect(document.title).toBe("Original title");
  });
});
