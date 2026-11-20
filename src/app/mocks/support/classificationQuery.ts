import type { Classification } from "@/entities/classification";

/**
 * Shared search/status/sort/page/pageSize filtering, used by both
 * `GET /classifications` and `GET /batches/:id/items` (same param shape,
 * per docs/api-contract.md's "same filters as classifications" note).
 */
export function applyClassificationListParams(
  items: Classification[],
  url: URL,
): { items: Classification[]; total: number; page: number; pageSize: number } {
  const statusParam = url.searchParams.get("status");
  const statusFilter = statusParam ? statusParam.split(",") : null;
  const searchParam = url.searchParams.get("search")?.trim().toLowerCase() || null;
  const page = Number(url.searchParams.get("page") ?? "1");
  const pageSize = Number(url.searchParams.get("pageSize") ?? "50");

  let filtered = statusFilter ? items.filter((item) => statusFilter.includes(item.status)) : items;
  if (searchParam) {
    filtered = filtered.filter(
      (item) =>
        item.description.toLowerCase().includes(searchParam) ||
        item.suggestedCode.toLowerCase().includes(searchParam) ||
        (item.finalCode?.toLowerCase().includes(searchParam) ?? false),
    );
  }

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
  const start = (page - 1) * pageSize;
  const pageItems = sorted.slice(start, start + pageSize);

  return { items: pageItems, total: filtered.length, page, pageSize };
}
