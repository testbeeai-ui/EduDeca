export const SUPABASE_PAGE_SIZE = 1000;

type PageResult<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

/**
 * PostgREST caps each response (default 1000). Page with `.range` until a short
 * page so Level 3 (1078+) and full-bank availability scans are complete.
 */
export async function fetchAllPaged<T>(
  loadPage: (from: number, to: number) => PromiseLike<PageResult<T>>,
  pageSize = SUPABASE_PAGE_SIZE,
): Promise<T[]> {
  const size = Math.max(1, Math.floor(pageSize));
  const all: T[] = [];
  for (let from = 0; ; from += size) {
    const to = from + size - 1;
    const { data, error } = await loadPage(from, to);
    if (error) {
      throw new Error(error.message || "Failed to load paged rows");
    }
    const batch = data ?? [];
    all.push(...batch);
    if (batch.length < size) break;
  }
  return all;
}
