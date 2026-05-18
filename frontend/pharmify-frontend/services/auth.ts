import { apiRequest } from "./api"

export async function registerUser(userData: any) {
  return apiRequest("/api/register/", "POST", userData)
}

export async function googleLogin(token: string) {
  return apiRequest("/api/google-login/", "POST", { token })
}