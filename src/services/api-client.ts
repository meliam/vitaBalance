/**
 * API client with retry logic and timeout handling.
 * Provides a resilient fetch wrapper for the ranking service.
 * If the API is unavailable, the game continues operating without interruption.
 */

const DEFAULT_RETRIES = 2;
const DEFAULT_TIMEOUT_MS = 5000;

/**
 * Base URL for the ranking API, read from environment variable.
 */
const getBaseUrl = (): string => {
  return import.meta.env.VITE_API_URL ?? '';
};

/**
 * Delays execution for the specified number of milliseconds.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculates exponential backoff delay for a given retry attempt.
 * Attempt 0 → 1000ms, Attempt 1 → 2000ms.
 */
function getBackoffDelay(attempt: number): number {
  return (attempt + 1) * 1000;
}

/**
 * Performs a fetch request with exponential backoff retry and AbortController timeout.
 *
 * - On network error or non-OK response, retries up to `retries` times.
 * - Uses AbortController to enforce a timeout per request attempt.
 * - Backoff delays: 1s after first failure, 2s after second failure.
 *
 * @param url - Relative or absolute URL to fetch. If relative, prepends VITE_API_URL.
 * @param options - Standard RequestInit options for fetch.
 * @param retries - Number of retry attempts (default: 2).
 * @param timeoutMs - Timeout in milliseconds per attempt (default: 5000).
 * @returns The Response from a successful fetch.
 * @throws The last error encountered after all retries are exhausted.
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries: number = DEFAULT_RETRIES,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  const fullUrl = url.startsWith('http') ? url : `${getBaseUrl()}${url}`;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(fullUrl, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      lastError = error;

      if (attempt < retries) {
        await delay(getBackoffDelay(attempt));
      }
    }
  }

  throw lastError;
}
