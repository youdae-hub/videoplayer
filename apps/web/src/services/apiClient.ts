const DEFAULT_BASE_URL = 'http://localhost:1337';

interface ApiClientOptions {
  baseUrl?: string;
}

interface ApiError {
  status: number;
  message: string;
}

function getBaseUrl(options?: ApiClientOptions): string {
  return options?.baseUrl || import.meta.env.VITE_STRAPI_URL || DEFAULT_BASE_URL;
}

export function createApiClient(options?: ApiClientOptions) {
  const baseUrl = getBaseUrl(options);

  async function request<T>(endpoint: string, init?: RequestInit): Promise<T> {
    const url = `${baseUrl}${endpoint}`;
    const response = await fetch(url, init);

    if (!response.ok) {
      const error: ApiError = {
        status: response.status,
        message: `API error: ${response.status} ${response.statusText}`,
      };
      throw error;
    }

    if (response.status === 204) return undefined as T;
    return response.json();
  }

  return {
    get<T>(endpoint: string): Promise<T> {
      return request<T>(endpoint);
    },
    post<T>(endpoint: string, body: unknown): Promise<T> {
      return request<T>(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    },
    put<T>(endpoint: string, body: unknown): Promise<T> {
      return request<T>(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    },
    delete<T>(endpoint: string): Promise<T> {
      return request<T>(endpoint, { method: 'DELETE' });
    },
    upload<T>(endpoint: string, formData: FormData): Promise<T> {
      return request<T>(endpoint, {
        method: 'POST',
        body: formData,
      });
    },
  };
}
