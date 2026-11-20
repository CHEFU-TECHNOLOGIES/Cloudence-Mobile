import { API_BASE_URL, CHEFU_APP_ID } from "./config";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type UnauthorizedHandler = (accessToken: string) => Promise<void>;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler) {
  unauthorizedHandler = handler;
  return () => {
    if (unauthorizedHandler === handler) unauthorizedHandler = null;
  };
}

export function getApiUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getAuthHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "x-chefu-app": CHEFU_APP_ID,
  };
}

function abortError() {
  const error = new Error("The request was cancelled.");
  error.name = "AbortError";
  return error;
}

function waitBeforeRetry(delayMs: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError());
      return;
    }

    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", cancel);
      resolve();
    }, delayMs);
    const cancel = () => {
      clearTimeout(timer);
      reject(abortError());
    };
    signal?.addEventListener("abort", cancel, { once: true });
  });
}

function isRetryableStatus(status: number) {
  return status === 408 || status === 429 || status >= 500;
}

export async function apiRequest<T>(
  path: string,
  accessToken: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  for (const [key, value] of Object.entries(getAuthHeaders(accessToken))) {
    headers.set(key, value);
  }

  const isRead = (init.method ?? "GET").toUpperCase() === "GET";
  const delays = [250, 700];
  let response: Response | undefined;
  let requestError: unknown;

  for (let attempt = 0; attempt <= (isRead ? delays.length : 0); attempt += 1) {
    try {
      response = await fetch(getApiUrl(path), {
        ...init,
        headers,
      });
      requestError = undefined;
      if (response.ok || !isRead || !isRetryableStatus(response.status)) break;
      if (attempt === delays.length) break;

      const retryAfter = Number(response.headers.get("Retry-After"));
      const delayMs = Number.isFinite(retryAfter)
        ? Math.min(Math.max(retryAfter * 1000, 0), 2000)
        : delays[attempt];
      await response.body?.cancel();
      await waitBeforeRetry(delayMs, init.signal ?? undefined);
    } catch (error) {
      if (init.signal?.aborted || (error instanceof Error && error.name === "AbortError")) {
        throw error;
      }
      requestError = error;
      if (!isRead || attempt === delays.length) throw error;
      await waitBeforeRetry(delays[attempt], init.signal ?? undefined);
    }
  }

  if (!response) {
    throw requestError instanceof Error
      ? requestError
      : new Error("The request did not return a response.");
  }
  if (!response.ok) {
    if (response.status === 401) {
      await unauthorizedHandler?.(accessToken);
    }
    const body = await response.text();
    throw new ApiError(getApiErrorMessage(body, response.status), response.status);
  }

  return (await response.json()) as T;
}

export function getApiErrorMessage(body: string, status: number) {
  if (body) {
    try {
      const result: unknown = JSON.parse(body);
      if (typeof result === "object" && result !== null) {
        const message = Reflect.get(result, "message") ?? Reflect.get(result, "error");
        if (typeof message === "string" && message.trim()) return message;
      }
    } catch {
      return body;
    }

    return body;
  }

  return `Request failed with status ${status}.`;
}
