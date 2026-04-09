import { fetch } from "expo/fetch";
import { useAuthStore } from "@/lib/auth-store";
import { supabase } from "@/lib/supabase";

interface ApiResponse<T> {
  data: T;
}

const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL!;

async function getAccessToken(): Promise<string | null> {
  // Prioritera lagrad token (t.ex. dev-token eller cached Supabase-token)
  const stored = useAuthStore.getState().sessionToken;
  if (stored) return stored;

  // Fallback: hämta från Supabase-session
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      return data.session.access_token;
    }
  } catch (_) {}

  return null;
}

const request = async <T>(
  url: string,
  options: { method?: string; body?: string } = {}
): Promise<T> => {
  const token = await getAccessToken();

  const headers: Record<string, string> = {};
  if (options.body) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${baseUrl}${url}`, {
    ...options,
    headers,
  });

  // 1. Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  // 2. JSON responses: parse and unwrap { data }
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    const json = await response.json();
    if (json.error) {
      throw new Error(json.error.message ?? "API error");
    }
    const typed = json as ApiResponse<T>;
    return typed.data;
  }

  // 3. Non-JSON: return undefined
  return undefined as T;
};

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body: any) =>
    request<T>(url, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(url: string, body: any) =>
    request<T>(url, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(url: string) => request<T>(url, { method: "DELETE" }),
  patch: <T>(url: string, body: any) =>
    request<T>(url, { method: "PATCH", body: JSON.stringify(body) }),
  raw: <T>(url: string, options?: { method?: string; body?: string }) =>
    request<T>(url, options),
};
