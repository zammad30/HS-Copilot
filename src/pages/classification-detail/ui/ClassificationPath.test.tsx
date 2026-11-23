import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import type { PathLevel } from "@/entities/classification";
import { ClassificationPath } from "./ClassificationPath";

const PATH: PathLevel[] = [
  { level: "chapter", code: "85", title: "Electrical machinery and equipment" },
  { level: "heading", code: "8518", title: "Microphones, loudspeakers, headphones" },
  { level: "subheading", code: "8518.30", title: "Wireless earphones" },
  { level: "national", code: "8518.30.0000", title: "Wireless earphones", isSample: true },
];

describe("ClassificationPath", () => {
  it("renders every level in order as a list, each with its code and title", () => {
    render(<ClassificationPath path={PATH} />);

    const list = screen.getByRole("list");
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(4);
    expect(items[0]).toHaveTextContent("Chapter");
    expect(items[0]).toHaveTextContent("85");
    expect(items[0]).toHaveTextContent("Electrical machinery and equipment");
    expect(items[1]).toHaveTextContent("Heading");
    expect(items[1]).toHaveTextContent("8518");
    expect(items[2]).toHaveTextContent("Subheading");
    expect(items[2]).toHaveTextContent("8518.30");
    expect(screen.getByRole("heading", { name: "Classification path" })).toBeInTheDocument();
  });

  it("ends with the effective code as the last level", () => {
    render(<ClassificationPath path={PATH} />);

    const items = screen.getAllByRole("listitem");
    expect(items[items.length - 1]).toHaveTextContent("8518.30.0000");
  });

  it("shows the overridden code as the last level when the path carries it", () => {
    const overriddenPath: PathLevel[] = [
      ...PATH.slice(0, 3),
      { level: "national", code: "8518.22.0000", title: "Loudspeakers", isSample: true },
    ];
    render(<ClassificationPath path={overriddenPath} />);

    const items = screen.getAllByRole("listitem");
    expect(items[items.length - 1]).toHaveTextContent("8518.22.0000");
    expect(screen.queryByText("8518.30.0000")).not.toBeInTheDocument();
  });

  it("labels only the sample level with the sample label", () => {
    render(<ClassificationPath path={PATH} />);

    const items = screen.getAllByRole("listitem");
    expect(within(items[3]).getByText("Sample data")).toBeInTheDocument();
    expect(within(items[0]).queryByText("Sample data")).not.toBeInTheDocument();
    expect(screen.getAllByText("Sample data")).toHaveLength(1);
  });

  it("renders nothing when the path is missing or empty", () => {
    const { container, rerender } = render(<ClassificationPath />);
    expect(container).toBeEmptyDOMElement();

    rerender(<ClassificationPath path={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
