const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://api.preview.globalwealth.finance"

type RequestInitLite = Omit<RequestInit, "body"> & { body?: unknown }

async function request<T>(path: string, init?: RequestInitLite): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      body: init?.body ? JSON.stringify(init.body) : undefined,
    })
    if (!response.ok) {
      throw new Error(`API error ${response.status}`)
    }
    return (await response.json()) as T
  } catch (error) {
    console.warn("Falling back to mocked response for", path, error)
    throw error
  }
}

export function apiGet<T>(path: string) {
  return request<T>(path)
}

export function apiPost<T>(path: string, body?: unknown) {
  return request<T>(path, { method: "POST", body })
}

