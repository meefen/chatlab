const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export async function apiRequest(
  method: string,
  endpoint: string,
  data?: unknown
): Promise<Response> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }

  return res;
}

export async function get(endpoint: string) {
  const res = await apiRequest('GET', endpoint);
  return res.json();
}

export async function post(endpoint: string, data?: unknown) {
  const res = await apiRequest('POST', endpoint, data);
  return res.json();
}

export async function put(endpoint: string, data?: unknown) {
  const res = await apiRequest('PUT', endpoint, data);
  return res.json();
}

export async function del(endpoint: string) {
  const res = await apiRequest('DELETE', endpoint);
  return res.json();
}