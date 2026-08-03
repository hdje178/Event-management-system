import { requestJson, type RequestJsonArgs, type Result } from "./client.js";
import { tokenStore } from "../state/auth_store.js";
import type { UserResponseDto } from "../types/user.types.js";

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  user: UserResponseDto;
  accessToken: string;
}

export interface RegisterResponse {
  user: UserResponseDto;
  accessToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface TokenPayload {
  userId: number;
  role: string;
  jti: string;
  exp: number;
}

export interface MeResponse {
  user: TokenPayload;
}

export interface ProfileResponse {
  user: UserResponseDto;
}

export async function requestWithAuthRetry<T = unknown>(
  args: RequestJsonArgs,
): Promise<Result<T>> {
  let res = await requestJson<T>({ ...args, auth: true });
  if (res.ok) return res;

  if (!res.ok && res.error?.status === 401 && res.error?.code === "TOKEN_EXPIRED") {
    const refreshRes = await requestJson<RefreshResponse>({ method: "POST", path: "/auth/refresh" });
    if (refreshRes.ok) {
      tokenStore.set(refreshRes.data.accessToken);
      res = await requestJson<T>({ ...args, auth: true });
      return res;
    }
  }
  return res;
}

export async function GetMe() {
  return await requestWithAuthRetry<MeResponse>({ method: "GET", path: "/auth/me" });
}

export async function Logout() {
  const res = await requestWithAuthRetry<{ ok: true; message: string }>({ method: "POST", path: "/auth/logout" });
  if (res.ok) tokenStore.clear();
  return res;
}

export async function Login(dto: LoginDto) {
  const res = await requestJson<LoginResponse, LoginDto>({ method: "POST", path: "/auth/login", body: dto });
  if (res.ok) tokenStore.set(res.data.accessToken);
  return res;
}

export async function Register(dto: RegisterDto) {
  return await requestJson<RegisterResponse, RegisterDto>({ method: "POST", path: "/auth/registration", body: dto, auth: false });
}

export async function Refresh() {
  return await requestJson<RefreshResponse>({ method: "POST", path: "/auth/refresh", auth: false });
}

export async function GetMyProfile() {
  return await requestWithAuthRetry<ProfileResponse>({ method: "GET", path: "/auth/me/profile" });
}
