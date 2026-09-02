// Thin fetch wrapper — consistent base URL + JSON handling.
// React Query handles retry, loading, error state — no axios needed.

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: any,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function formatApiError(error: unknown, fallback = "Request failed"): string {
  if (!(error instanceof ApiError)) return error instanceof Error ? error.message : fallback;
  const body = error.body as { error?: unknown; missing?: unknown; fieldErrors?: Record<string, string[]> } | undefined;
  if (Array.isArray(body?.missing)) {
    const labels = body.missing.map((item) => typeof item === "string" ? item : (item as { label?: string }).label).filter(Boolean);
    if (labels.length) return `${error.message}: ${labels.join(", ")}`;
  }
  const fieldErrors = body?.fieldErrors ?? (typeof body?.error === "object" && body.error ? (body.error as { fieldErrors?: Record<string, string[]> }).fieldErrors : undefined);
  if (fieldErrors) {
    const messages = Object.entries(fieldErrors).flatMap(([field, reasons]) => reasons.map((reason) => `${field}: ${reason}`));
    if (messages.length) return messages.join("; ");
  }
  return typeof error.message === "string" ? error.message : fallback;
}

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, typeof body.error === "string" ? body.error : res.statusText, body);
  }

  if (res.status === 204) return null as T;
  
  const text = await res.text();
  if (!text) return null as T;
  
  return JSON.parse(text) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(data) }),
  patch: <T>(path: string, data: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(data) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export { ApiError };
