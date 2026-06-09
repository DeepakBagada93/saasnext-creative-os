const DEFAULT_SERVER_URL = "http://localhost:3000";
const DEFAULT_API_KEY = "cos_live_mockkey12345";

export interface ServerSettings {
  serverUrl: string;
  apiKey: string;
}

export function getServerSettings(): ServerSettings {
  if (typeof window === "undefined") {
    return { serverUrl: DEFAULT_SERVER_URL, apiKey: DEFAULT_API_KEY };
  }

  const savedUrl = localStorage.getItem("cos_server_url");
  const savedKey = localStorage.getItem("cos_api_key");

  return {
    serverUrl: savedUrl || DEFAULT_SERVER_URL,
    apiKey: savedKey || DEFAULT_API_KEY,
  };
}

export function saveServerSettings(serverUrl: string, apiKey: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("cos_server_url", serverUrl);
    localStorage.setItem("cos_api_key", apiKey);
  }
}

export async function requestMcpApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const { serverUrl, apiKey } = getServerSettings();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${serverUrl}${cleanEndpoint}`;

  const headers = new Headers(options.headers || {});
  headers.set("x-api-key", apiKey);
  headers.set("Content-Type", "application/json");

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorJson;
    try {
      errorJson = JSON.parse(errorText);
    } catch {
      // not JSON
    }
    throw new Error(errorJson?.error || errorText || `HTTP Error ${response.status}`);
  }

  return response.json() as Promise<T>;
}
