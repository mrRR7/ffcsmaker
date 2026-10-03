// PostgREST silently caps every response at the project's max_rows (1000 on
// hosted Supabase), so a single unbounded select quietly drops the tail of a
// large table. Page with range() instead. `from` advances by the rows
// actually returned, so this stays correct even if max_rows is configured
// below PAGE_SIZE. The query must have a stable order.
const PAGE_SIZE = 1000;

export async function fetchAllRows<T>(
  page: (
    from: number,
    to: number
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; ) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) {
      throw new Error(error.message);
    }
    if (!data || data.length === 0) {
      return rows;
    }
    rows.push(...data);
    from += data.length;
  }
}
