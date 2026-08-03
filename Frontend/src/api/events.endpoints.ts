import { requestJson, type Result } from "./client.js";
import { requestWithAuthRetry } from "./client.auth.js";
import type {
  CreateEventDto,
  UpdateEventPatchDto,
  UpdateEventPutDto,
  QueryEventDto,
  EventResponseDto,
} from "../types/event.types.js";
import type { Paginated } from "../types/api.types.js";

type EventsList = Paginated<EventResponseDto>;
let cache: Record<string, Result<EventsList>> = {};

function toSearchParams(q: string | URLSearchParams | QueryEventDto): URLSearchParams {
  if (typeof q === "string") return new URLSearchParams(q);
  if (q instanceof URLSearchParams) return q;
  const sp = new URLSearchParams();
  if (q.limit !== undefined) sp.set("limit", String(q.limit));
  if (q.offset !== undefined) sp.set("offset", String(q.offset));
  if (q.search) sp.set("search", q.search);
  if (q.sortBy) sp.set("sortBy", q.sortBy);
  return sp;
}

export async function getEvents(
  q: string | URLSearchParams | QueryEventDto,
  signal?: AbortSignal,
): Promise<Result<EventsList>> {
  const qs = toSearchParams(q).toString();
  const path = qs ? `/events?${qs}` : "/events";
  if (cache[qs]) {
    console.log("Взято з кешу", qs);
    return cache[qs];
  }
  console.log("Відбувся запит до серверу");
  const data = await requestJson<Paginated<EventResponseDto>>({ method: "GET", path, signal });
  cache[qs] = data;
  return data;
}

export async function createEvents(dto: CreateEventDto, signal?: AbortSignal) {
  const data = await requestWithAuthRetry<EventResponseDto>({ method: "POST", path: "/events", body: dto, signal });
  cache = {};
  return data;
}

export async function updateEventsPut(id: number | string, dto: UpdateEventPutDto) {
  const data = await requestWithAuthRetry<EventResponseDto>({
    method: "PUT",
    path: `/events/${encodeURIComponent(id)}`,
    body: dto,
  });
  cache = {};
  return data;
}

export async function updateEventsPatch(id: number | string, dto: UpdateEventPatchDto) {
  const data = await requestWithAuthRetry<EventResponseDto>({
    method: "PATCH",
    path: `/events/${encodeURIComponent(id)}`,
    body: dto,
  });
  cache = {};
  return data;
}

export async function deleteEvent(id: number | string) {
  const data = await requestWithAuthRetry<{ ok: true } | null>({
    method: "DELETE",
    path: `/events/${encodeURIComponent(id)}`,
  });
  cache = {};
  return data;
}
