import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { http } from "@/shared/api";
import { classificationKeys, classificationListResponseSchema } from "@/entities/classification";
import { useDeleteClassification } from "@/features/delete-classification";
import { ExpiringBanner } from "./ExpiringBanner";

function DeleteButton({ id }: { id: string }) {
  const remove = useDeleteClassification();
  return <button onClick={() => remove.mutate(id)}>Delete record</button>;
}

// Kept in its own file: the delete changes the shared mock store, which tests/setup.ts does
// not reset, and every test file gets a fresh module state.
describe("ExpiringBanner refresh", () => {
  it("has its own cache key, separate from the Library list", () => {
    const banner = classificationKeys.list({ expiring: true, pageSize: 1 });
    const library = classificationKeys.list({ pageSize: 10 });
    expect(banner).not.toEqual(library);
    expect(banner.slice(0, 2)).toEqual(classificationKeys.lists());
  });

  it("drops the banner once the expiring record is deleted", async () => {
    await http.put("/__mock/plan", { plan: "free" });
    const list = classificationListResponseSchema.parse(
      await http.get("/classifications?expiring=true"),
    );
    expect(list.total).toBe(1);

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ExpiringBanner />
          <DeleteButton id={list.items[0].id} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText(/1 record will expire within 10 days\./)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Delete record" }));

    await waitFor(() => expect(screen.queryByText(/will expire within/)).not.toBeInTheDocument());
  });
});
