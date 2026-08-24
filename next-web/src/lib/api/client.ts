export type ApiClientOptions = { baseUrl?: string; fetcher?: typeof fetch };

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) { super(message); this.name = "ApiError"; }
}

export function createApiClient(options: ApiClientOptions = {}) {
  const baseUrl = options.baseUrl ?? process.env.NEXT_PUBLIC_API_URL ?? "";
  const fetcher = options.fetcher ?? fetch;
  return {
    async get<T>(path: string, init?: RequestInit): Promise<T> {
      const response = await fetcher(`${baseUrl}${path}`, { ...init, method: "GET", headers: { Accept: "application/json", ...init?.headers } });
      if (!response.ok) throw new ApiError(response.status, `API request failed: ${response.status}`);
      return response.json() as Promise<T>;
    },
    async post<T>(path: string, body: unknown, init?: RequestInit): Promise<T> {
      const response = await fetcher(`${baseUrl}${path}`, { ...init, method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json", ...init?.headers }, body: JSON.stringify(body) });
      if (!response.ok) throw new ApiError(response.status, `API request failed: ${response.status}`);
      return response.json() as Promise<T>;
    },
  };
}

export const api = createApiClient();
