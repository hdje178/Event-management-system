import { requestWithAuthRetry } from "./client.auth.js";
import type {
  CreateRegistrationDto,
  UpdateRegistrationPatchDto,
  UpdateRegistrationPutDto,
  RegistrationResponseDto,
} from "../types/registration.types.js";
import type { Result } from "./client.js";
import type { Paginated } from "../types/api.types.js";

export async function getMyRegistration(signal?: AbortSignal): Promise<
  Result<Paginated<RegistrationResponseDto>>
> {
  return await requestWithAuthRetry<Paginated<RegistrationResponseDto>>({
    method: "GET",
    path: "/registrations/me",
    signal,
  });
}

export async function getRegistrations(signal?: AbortSignal): Promise<
  Result<Paginated<RegistrationResponseDto>>
> {
  return await requestWithAuthRetry<Paginated<RegistrationResponseDto>>({
    method: "GET",
    path: "/registrations",
    signal,
  });
}

export async function getRegistrationById(
  id: string | number,
  signal?: AbortSignal,
): Promise<Result<RegistrationResponseDto>> {
  return await requestWithAuthRetry<RegistrationResponseDto>({
    method: "GET",
    path: `/registrations/${id}`,
    signal,
  });
}

export async function addRegistrations(
  dto: CreateRegistrationDto,
  signal?: AbortSignal,
): Promise<Result<RegistrationResponseDto>> {
  return await requestWithAuthRetry<RegistrationResponseDto>({
    method: "POST",
    path: "/registrations",
    body: dto,
    signal,
  });
}

export async function updateRegistrationPatch(
  id: string | number,
  dto: UpdateRegistrationPatchDto,
  signal?: AbortSignal,
): Promise<Result<RegistrationResponseDto>> {
  return await requestWithAuthRetry<RegistrationResponseDto>({
    method: "PATCH",
    path: `/registrations/${id}`,
    body: dto,
    signal,
  });
}

export async function updateRegistrationPut(
  id: string | number,
  dto: UpdateRegistrationPutDto,
  signal?: AbortSignal,
): Promise<Result<RegistrationResponseDto>> {
  return await requestWithAuthRetry<RegistrationResponseDto>({
    method: "PUT",
    path: `/registrations/${id}`,
    body: dto,
    signal,
  });
}

export async function deleteRegistration(
  id: string | number,
  signal?: AbortSignal,
): Promise<Result<{ ok: true } | null>> {
  return await requestWithAuthRetry<{ ok: true } | null>({
    method: "DELETE",
    path: `/registrations/${id}`,
    signal,
  });
}
