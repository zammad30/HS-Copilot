import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider } from "@/shared/ui/Toast";
import { useCopyToClipboard } from "./useCopyToClipboard";

function wrapper({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}

describe("useCopyToClipboard", () => {
  it("writes the text to the clipboard and shows the message in a toast", async () => {
    userEvent.setup(); // installs the navigator.clipboard stub
    const writeTextSpy = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
    const { result } = renderHook(() => useCopyToClipboard(), { wrapper });

    result.current("8518.30.0000", "HS code copied");

    expect(writeTextSpy).toHaveBeenCalledWith("8518.30.0000");
    expect(await screen.findByRole("status")).toHaveTextContent("HS code copied");
  });
});
