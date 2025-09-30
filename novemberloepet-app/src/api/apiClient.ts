// Small fetch-based API client used by src/api wrappers.
// Provides: get/post/put/delete helpers, timeout and retry with backoff, and consistent error shape.

type ApiResponse<T> = { ok: boolean; status: number; data: T };

const DEFAULT_TIMEOUT = 10000; // ms
const DEFAULT_RETRIES = 2;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function httpRequest<T>(input: RequestInfo, init: RequestInit = {}, timeout = DEFAULT_TIMEOUT, retries = DEFAULT_RETRIES): Promise<ApiResponse<T>> {
  let attempt = 0;
  while (true) {
    attempt++;
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeout) : null;
    try {
      const res = await fetch(input, { ...init, signal: controller ? controller.signal : undefined });
      if (timer) clearTimeout(timer);
      const contentType = res.headers.get ? res.headers.get('content-type') || '' : '';
      let data: any = null;
      if (contentType.includes('application/json')) data = await res.json(); else data = await res.text();
      return { ok: res.ok, status: res.status, data };
    } catch (err: any) {
      if (controller && controller.signal && controller.signal.aborted) {
        // timeout
        if (attempt <= retries) {
          const backoff = Math.min(60000, 200 * Math.pow(2, attempt));
          await sleep(backoff);
          continue;
        }
        throw new Error('Request timed out');
      }
      // network error
      if (attempt <= retries) {
        const backoff = Math.min(60000, 200 * Math.pow(2, attempt));
        await sleep(backoff);
        continue;
      }
      throw err;
    }
  }
}

export async function apiGet<T>(path: string): Promise<ApiResponse<T>> {
  return httpRequest<T>(path, { method: 'GET', headers: { 'Accept': 'application/json' } });
}

export async function apiPost<T>(path: string, body: any): Promise<ApiResponse<T>> {
  return httpRequest<T>(path, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(body) });
}

export async function apiPut<T>(path: string, body: any): Promise<ApiResponse<T>> {
  return httpRequest<T>(path, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(body) });
}

export async function apiDelete<T>(path: string): Promise<ApiResponse<T>> {
  return httpRequest<T>(path, { method: 'DELETE', headers: { 'Accept': 'application/json' } });
}

export type { ApiResponse };
export default { apiGet, apiPost, apiPut, apiDelete };
