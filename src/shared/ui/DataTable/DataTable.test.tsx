import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { DataTable } from "./DataTable";
import type { DataTableColumn } from "./DataTable";

interface Row {
  id: string;
  name: string;
  status: string;
}

const ROWS: Row[] = [
  { id: "1", name: "First product", status: "approved" },
  { id: "2", name: "Second product", status: "needs_review" },
];

const COLUMNS: DataTableColumn<Row>[] = [
  { key: "name", header: "Product", render: (row) => row.name },
  { key: "status", header: "Status", render: (row) => row.status },
];

function renderTable(extra: Partial<Parameters<typeof DataTable<Row>>[0]> = {}) {
  return render(
    <MemoryRouter>
      <DataTable
        columns={COLUMNS}
        rows={ROWS}
        getRowKey={(row) => row.id}
        rowHref={(row) => `/items/${row.id}`}
        {...extra}
      />
    </MemoryRouter>,
  );
}

describe("DataTable", () => {
  it("renders a header per column and a row per item", () => {
    renderTable();
    expect(screen.getByRole("columnheader", { name: "Product" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Status" })).toBeInTheDocument();
    expect(screen.getByText("First product")).toBeInTheDocument();
    expect(screen.getByText("Second product")).toBeInTheDocument();
  });

  it("renders the first column as a real, keyboard-focusable Link to rowHref", () => {
    renderTable();
    const link = screen.getByRole("link", { name: "First product" });
    expect(link.tagName.toLowerCase()).toBe("a");
    expect(link).toHaveAttribute("href", "/items/1");
  });

  it("applies the highlighted class when isRowHighlighted returns true", () => {
    renderTable({ isRowHighlighted: (row) => row.status === "needs_review" });
    const highlightedRow = screen.getByText("Second product").closest("tr");
    const plainRow = screen.getByText("First product").closest("tr");
    expect(highlightedRow?.className).toMatch(/highlighted/);
    expect(plainRow?.className).not.toMatch(/highlighted/);
  });

  it("renders custom row actions when renderActions is given", () => {
    renderTable({ renderActions: (row) => <button>{`Actions for ${row.name}`}</button> });
    expect(screen.getByRole("button", { name: "Actions for First product" })).toBeInTheDocument();
  });
});
