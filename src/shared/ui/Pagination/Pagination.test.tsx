import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Pagination } from "./Pagination";

describe("Pagination", () => {
  it("renders the range text from page, pageSize and total", () => {
    render(<Pagination page={2} pageSize={10} total={14} onPageChange={() => {}} />);
    expect(screen.getByText("Showing 11–14 of 14")).toBeInTheDocument();
  });

  it("shows zero range when there are no results", () => {
    render(<Pagination page={1} pageSize={10} total={0} onPageChange={() => {}} />);
    expect(screen.getByText("Showing 0–0 of 0")).toBeInTheDocument();
  });

  it("disables Previous on the first page and calls onPageChange(page + 1) from Next", async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    render(<Pagination page={1} pageSize={10} total={14} onPageChange={onPageChange} />);

    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).not.toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("disables Next on the last page and calls onPageChange(page - 1) from Previous", async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    render(<Pagination page={2} pageSize={10} total={14} onPageChange={onPageChange} />);

    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Previous" }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("moves focus to Previous when Next becomes disabled after reaching the last page", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [page, setPage] = useState(1);
      return <Pagination page={page} pageSize={10} total={20} onPageChange={setPage} />;
    }
    render(<Controlled />);

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Previous" })).toHaveFocus();
  });

  it("moves focus to Next when Previous becomes disabled after reaching the first page", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [page, setPage] = useState(2);
      return <Pagination page={page} pageSize={10} total={20} onPageChange={setPage} />;
    }
    render(<Controlled />);

    await user.click(screen.getByRole("button", { name: "Previous" }));
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toHaveFocus();
  });

  it("uses a custom aria-label when given", () => {
    render(
      <Pagination page={1} pageSize={10} total={14} onPageChange={() => {}} label="Library" />,
    );
    expect(screen.getByRole("navigation", { name: "Library" })).toBeInTheDocument();
  });
});
