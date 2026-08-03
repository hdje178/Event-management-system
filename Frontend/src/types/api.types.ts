export interface RequestArgs {
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    path: string;
    body?: unknown;
    signal?: AbortSignal;
    auth?: boolean;
}

export interface ApiSuccessResponse<T = unknown> {
    ok: true;
    data: T;
}

export interface ApiErrorResponse {
    ok: false;
    error: {
        kind: "abort" | "network" | "auth" | "conflict" | "http" | "parse";
        message: string;
        status?: number;
        code?: string;
        details?: unknown;
    };
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// Mirrors Backend/src/types/pagineted.type.ts
export type Paginated<T> = { data: T[]; total: number };