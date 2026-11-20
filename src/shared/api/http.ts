import type { z } from "zod";
import { env } from "@/shared/config";

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(message: string, options: { code: string; status: number; details?: unknown }) {
    super(message);
    this.name = "ApiError";
    this.code = options.code;
    this.status = options.status;
    this.details = options.details;
  }
}

type AuthHeaderProvider = () => Record<string, string>;

let authHeaderProvider: AuthHeaderProvider = () => ({});

export function setAuthHeaderProvider(provider: AuthHeaderProvider): void {
  authHeaderProvider = provider;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
}

interface ErrorPayload {
  error?: { code?: string; message?: string; details?: unknown };
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  // FormData (multipart uploads) is sent as-is: the browser sets its own
  // Content-Type with the multipart boundary, so JSON headers/stringify
  // would break it.
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...authHeaderProvider(),
    },
    body:
      options.body === undefined
        ? undefined
        : isFormData
          ? (options.body as FormData)
          : JSON.stringify(options.body),
    signal: options.signal,
  });

  const payload: unknown = await response.json().catch(() => undefined);

  if (!response.ok) {
    const { error } = (payload as ErrorPayload) ?? {};
    throw new ApiError(error?.message ?? response.statusText, {
      code: error?.code ?? "unknown_error",
      status: response.status,
      details: error?.details,
    });
  }

  return payload as T;
}

export const http = {
  get: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "PUT", body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "DELETE" }),
};

export function parseResponse<T>(schema: z.ZodType<T>, data: unknown): T {
  return schema.parse(data);
}
