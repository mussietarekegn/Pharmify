const BASE_URL = "https://pharmify-jugv.onrender.com"

export async function apiRequest(
  endpoint: string,
  method: string = "GET",
  data?: any,
  token?: string
) {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || "Something went wrong")
  }

  return result
}