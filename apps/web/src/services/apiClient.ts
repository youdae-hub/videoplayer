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

  async function request<T>(endpoint: string): Promise<T> {
    const url = `${baseUrl}${endpoint}`;
    const response = await fetch(url);

    if (!response.ok) {
      const error: ApiError = {
        status: response.status,
        message: `API error: ${response.status} ${response.statusText}`,
      };
      throw error;
    }

    return response.json();
  }

  return { get: request };
}
