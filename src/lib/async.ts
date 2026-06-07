/**
 * Run `fn` over `items` with at most `limit` in flight at once, preserving result order.
 * Used to pace provider requests so a user with many repos doesn't burst hundreds of
 * concurrent fetches (which trips secondary rate limits).
 */
export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let next = 0

  async function worker(): Promise<void> {
    while (next < items.length) {
      const index = next++
      results[index] = await fn(items[index], index)
    }
  }

  const size = Math.max(1, Math.min(limit, items.length))
  await Promise.all(Array.from({ length: size }, worker))
  return results
}
