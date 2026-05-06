/**
 * Lightweight fetch wrapper around the AkvoPura backend.
 *
 * - Holds the Bearer token in module memory (set on login, cleared on logout).
 * - Wraps non-2xx responses into ApiError so callers can `try/catch`.
 * - Throws ApiError('network_error') if the server is unreachable.
 */

import { API_BASE_URL } from './config';

let bearerToken: string | null = null;

export function setAuthToken(token: string | null) {
  bearerToken = token;
}

export function getAuthToken() {
  return bearerToken;
}

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status?: number,
  ) {
    super(message);
  }
}

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

type RequestOptions = {
  method?: Method;
  /** JSON body — will be stringified. */
  body?: unknown;
  /** Override / skip auth header. */
  auth?: boolean;
};

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, auth = true } = options;
  const url = `${API_BASE_URL}${path}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && bearerToken) headers.Authorization = `Bearer ${bearerToken}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Network error';
    throw new ApiError('network_error', msg);
  }

  let data: unknown = null;
  const text = await res.text();
  if (text.length > 0) {
    try {
      data = JSON.parse(text);
    } catch {
      // Server returned non-JSON — fall through with raw text in error.
    }
  }

  if (!res.ok) {
    const code = (data as { error?: string })?.error ?? `http_${res.status}`;
    const message =
      (data as { message?: string | string[] })?.message?.toString() ?? text;
    throw new ApiError(code, message, res.status);
  }

  return data as T;
}
