import { tokenStore } from "../state/auth_store.js";

const API_BASE = "http://localhost:5000/api/v1" as const;

export type ApiErrorKind =
  | "abort"
  | "network"
  | "http"
  | "parse"
  | "auth"
  | "conflict";

export type ApiError = {
  kind: ApiErrorKind;
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
};

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };

export interface RequestJsonArgs<TBody = unknown> {
  method: string;
  path: string;
  body?: TBody;
  signal?: AbortSignal;
  auth?: boolean;
}

async function tryReadJson<T = unknown>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function requestJson<TData = unknown, TBody = unknown>(
  args: RequestJsonArgs<TBody>,
): Promise<Result<TData>> {
  const { method, path, body, signal, auth = true } = args;
  const url = `${API_BASE}${path}`;

  const init: RequestInit = { method, signal, headers: {}, credentials: "include" };

  if (body !== undefined) {
    (init.headers as Record<string, string>)["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }
  if (auth) {
    const token = tokenStore.get();
    if (token) {
      (init.headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }
  }
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (e) {
    const err = e as Error & { name?: string };
    if (err?.name === "AbortError") {
      return {
        ok: false,
        error: { kind: "abort", message: "Request cancelled" },
      };
    }
    return {
      ok: false,
      error: { kind: "network", message: "Network error" },
    };
  }

  if (!res.ok) {
    const details = await tryReadJson<unknown>(res);
    type ErrorEnvelope = { error?: { code?: string; message?: string } };
    const isErrorEnvelope = (v: unknown): v is ErrorEnvelope =>
      typeof v === "object" && v !== null && "error" in (v as Record<string, unknown>);
    const env = isErrorEnvelope(details) ? details : undefined;
    if (res.status === 403 && env?.error?.message === "Invalid password or email") {
      return {
        ok: false,
        error: {
          kind: "auth",
          code: env?.error?.code,
          status: res.status,
          message: `HTTP ${res.status} ${res.statusText}`,
          details,
        },
      };
    }
    if (res.status === 409) {
      return {
        ok: false,
        error: {
          kind: "conflict",
          code: env?.error?.code,
          status: res.status,
          message: `HTTP ${res.status} ${res.statusText}`,
          details,
        },
      };
    }
    return {
      ok: false,
      error: {
        kind: "http",
        status: res.status,
        code: env?.error?.code,
        message: `HTTP ${res.status} ${res.statusText}`,
        details,
      },
    };
  }

  if (res.status === 204) {
    return { ok: true, data: null as unknown as TData };
  }

  try {
    const data = (await res.json()) as TData;
    return { ok: true, data };
  } catch {
    return {
      ok: false,
      error: { kind: "parse", message: "Failed to parse JSON" },
    };
  }
}
