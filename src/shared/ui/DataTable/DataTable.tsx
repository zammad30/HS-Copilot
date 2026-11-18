import type { ReactNode } from "react";
import { Link } from "react-router";
import clsx from "clsx";
import styles from "./DataTable.module.scss";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  /** The first column's cell is a real `Link` to this href, not a row-level click/keydown shim. */
  rowHref: (row: T) => string;
  renderActions?: (row: T) => ReactNode;
  isRowHighlighted?: (row: T) => boolean;
  density?: "default" | "compact";
}

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  rowHref,
  renderActions,
  isRowHighlighted,
  density = "default",
}: DataTableProps<T>) {
  return (
    <div className={styles.wrap}>
      <table className={clsx(styles.table, density === "compact" && styles.compact)}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={column.className}>
                {column.header}
              </th>
            ))}
            {renderActions && <th aria-label="Actions" />}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={getRowKey(row)}
              className={clsx(styles.row, isRowHighlighted?.(row) && styles.highlighted)}
            >
              {columns.map((column, columnIndex) => (
                <td key={column.key} className={column.className}>
                  {columnIndex === 0 ? (
                    <Link to={rowHref(row)} className={styles.rowLink}>
                      {column.render(row)}
                    </Link>
                  ) : (
                    column.render(row)
                  )}
                </td>
              ))}
              {renderActions && <td className={styles.actionsCell}>{renderActions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
