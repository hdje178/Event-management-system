export type UserRole = "USER" | "ADMIN" | string;

export interface UserResponseDto {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
}

export type UpdateUserPutDto = CreateUserDto & { role?: UserRole };
export type UpdateUserPatchDto = Partial<UpdateUserPutDto>;
