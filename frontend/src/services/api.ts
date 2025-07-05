import { supabase } from '../lib/supabase';

// Determine API base URL based on environment
const getApiBaseUrl = () => {
  // Check if we're in production (Vercel deployment)
  if (window.location.hostname.includes('vercel.app') || window.location.hostname.includes('chatlab-orcin')) {
    return 'https://chatlab-backend.onrender.com';
  }
  
  // Use environment variable or default to localhost
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
};

const API_BASE_URL = getApiBaseUrl();

export async function apiRequest(
  method: string,
  endpoint: string,
  data?: unknown
): Promise<Response> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get the current session token
  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token;
  
  
  const headers: Record<string, string> = {};
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }
  
  const res = await fetch(url, {
    method,
    headers,
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