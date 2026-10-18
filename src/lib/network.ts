export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 0) { super(message); this.status = status; }
}

export function normalizeServer(value: string, development: boolean) {
  let url: URL;
  try { url = new URL(value.trim()); } catch { throw new Error('Enter a valid API address, including https://.'); }
  if (url.protocol !== 'https:' && !(development && url.protocol === 'http:')) {
    throw new Error('The API must use HTTPS. HTTP is available only in development.');
  }
  if (url.username || url.password || url.search || url.hash || !['', '/'].includes(url.pathname)) {
    throw new Error('Use the server address only, without credentials, /api, or a query.');
  }
  return url.origin;
}

export async function request<T>(base: string, path: string, token: string | null,
  options: { method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; body?: unknown } = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    let response: Response;
    try {
      response = await fetch(`${base}/api${path}`, {
        method: options.method || 'GET', credentials: 'omit',
        headers: { 'Content-Type': 'application/json', 'X-Gurrai-Client': 'native', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: controller.signal,
      });
    } catch {
      throw new ApiError(options.method && options.method !== 'GET'
        ? 'The server did not confirm the save. Check your connection and retry with the same details.'
        : 'Cannot connect to Gurrai. Check your connection and server address.');
    }
    const data = await response.json().catch(() => null);
    if (!response.ok || !data) throw new ApiError(data?.error || 'The server returned an invalid response. Check the API address.', response.status);
    return data as T;
  } finally { clearTimeout(timeout); }
}

export function parseAmount(value: string) {
  const normalized = value.trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) throw new Error('Enter an amount with at most two decimal places.');
  const amount = Number(normalized);
  if (amount <= 0 || amount > 10000000) throw new Error('Enter an amount between 0.01 and 10000000.');
  return amount;
}

export const money = (amount: number) => `Rs ${amount.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Something went wrong. Please try again.';
