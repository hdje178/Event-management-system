import { z } from "zod";
import {
    createRegistrationSchema,
    updateRegistrationPutSchema,
    updateRegistrationPatchSchema
} from "../schemas/registration.schema.js";
import type { paramsEventSchema } from "../schemas/event.schemas.js";

export interface RegistrationDto {
    id: number;
    userId: number;
    eventId: number;
    createdAt: string;
    status: "pending" | "confirmed" | "canceled";
    updatedAt: string;
    description?: string;
}

export interface RegistrationDbDto {
    registration_id: number;
    user_id: number;
    event_id: number;
    status: "pending" | "confirmed" | "canceled";
    created_at: string;
    updated_at: string;
    description?: string;
}

export interface UserRegistrationsDto {
    registration_id: number;
    user_id: number;
    event_id: number;
    event_name: string;
    event_date: string;
    location: string;
    capacity: number;
    status: "pending" | "confirmed" | "canceled";
    created_at: string;
    updated_at: string;
    description?: string;
}

export interface RegistrationResponseDto {
    id: number;
    userId: number;
    status: "pending" | "confirmed" | "canceled";
    eventId: number;
    description?: string;
}

export type CreateRegistrationDto =
    z.infer<typeof createRegistrationSchema>;

export type UpdateRegistrationPutDto =
    z.infer<typeof updateRegistrationPutSchema>;

export type UpdateRegistrationPatchDto =
    z.infer<typeof updateRegistrationPatchSchema>;

export type ParamsRegistrationDto =
    z.infer<typeof paramsEventSchema>;