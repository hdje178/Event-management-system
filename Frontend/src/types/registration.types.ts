export type RegistrationStatus = "pending" | "confirmed" | "canceled";

export interface CreateRegistrationDto {
  eventId: string; // backend expects string, store passes String(eventId)
}

export interface UpdateRegistrationPutDto {
  status: RegistrationStatus;
  description?: string;
}

export type UpdateRegistrationPatchDto = Partial<UpdateRegistrationPutDto>;

export interface RegistrationResponseDto {
  id: number;
  userId: number;
  eventId: number;
  status: RegistrationStatus;
  description?: string;
}
