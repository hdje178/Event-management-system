import { requestWithAuthRetry } from "./client.auth.js";
import type { CreateUserDto, UpdateUserPatchDto, UpdateUserPutDto, UserResponseDto } from "../types/user.types.js";
import type { Result } from "./client.js";
import type { Paginated } from "../types/api.types.js";

function toSearchParams(q: string | URLSearchParams): URLSearchParams {
  if (typeof q === "string") return new URLSearchParams(q);
  return q;
}

export async function getUsers(
  q: string | URLSearchParams,
  signal?: AbortSignal,
): Promise<Result<Paginated<UserResponseDto>>> {
  const qs = toSearchParams(q).toString();
  const path = qs ? `/users?${qs}` : "/users";
  return requestWithAuthRetry<Paginated<UserResponseDto>>({ method: "GET", path, signal });
}

export async function createUsers(dto: CreateUserDto, signal?: AbortSignal) {
  return requestWithAuthRetry<UserResponseDto>({ method: "POST", path: "/users", body: dto, signal });
}

export function updateUserPut(id: number | string, dto: UpdateUserPutDto) {
  return requestWithAuthRetry<UserResponseDto>({
    method: "PUT",
    path: `/users/${encodeURIComponent(id)}`,
    body: dto,
  });
}

export function updateUserPatch(id: number | string, dto: UpdateUserPatchDto) {
  return requestWithAuthRetry<UserResponseDto>({
    method: "PATCH",
    path: `/users/${encodeURIComponent(id)}`,
    body: dto,
  });
}

export function deleteUser(id: number | string) {
  return requestWithAuthRetry<{ ok: true } | null>({
    method: "DELETE",
    path: `/users/${encodeURIComponent(id)}`,
  });
}

export function getUser(id: number | string) {
  return requestWithAuthRetry<UserResponseDto>({
    method: "GET",
    path: `/users/${encodeURIComponent(id)}`,
  });
}
