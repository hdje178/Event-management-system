export type SortBy =
  | "number_sorter"
  | "name_sorter"
  | "capacity_sorter"
  | "date_sorter";

export interface QueryEventDto {
  limit?: number; // default 20
  offset?: number; // default 0
  search?: string;
  sortBy?: SortBy;
}

export interface EventResponseDto {
  id: number;
  name: string;
  date: string; // ISO string from backend
  location: string;
  capacity: number;
  description: string;
}

export interface CreateEventDto {
  name: string;
  date: string; // expects yyyy-MM-dd from UI; backend transforms to ISO
  location: string;
  capacity: number;
  description: string;
}

export type UpdateEventPutDto = CreateEventDto;
export type UpdateEventPatchDto = Partial<CreateEventDto>;
