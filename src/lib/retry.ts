/**
 * Retry wrapper with exponential backoff for external API calls.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { maxRetries?: number; baseDelayMs?: number; label?: string } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 500, label = "operation" } = opts;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries) {
        console.error(`[retry] ${label} failed after ${maxRetries + 1} attempts:`, err);
        throw err;
      }
      const delay = baseDelayMs * 2 ** attempt;
      console.warn(`[retry] ${label} attempt ${attempt + 1} failed, retrying in ${delay}ms`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("Unreachable");
}
