import type { EventResponseDto } from "../types/event.types.js";
import type { UserResponseDto } from "../types/user.types.js";
import type { RegistrationResponseDto } from "../types/registration.types.js";
import type { ApiError } from "../api/client.js";
import type { TokenPayload } from "../api/client.auth.js";

export type ScreenError = ApiError | string | null;

export type EventsFormValues = {
  name: string;
  date: string; // yyyy-MM-dd from UI
  location: string;
  capacity: string; // kept as string in UI; coerced to number on submit
  description: string;
};

export type UsersFormValues = {
  name: string;
  email: string;
  password: string;
};

export type LoginFormValues = {
  name: string; // preserved from original state
  email: string;
  password: string;
};

export type RegistrationFormValues = UsersFormValues;

export type FormState<TValues> = {
  values: TValues;
  touched: Record<string, boolean>;
  errors: Partial<Record<keyof TValues, string>> & Record<string, string>;
  isValid: boolean;
  generalError: string | null;
};

// Проста форма помилок для редагування таблиць: ключі тільки з відомого списку
export type EditErrors<TFields extends string> = Record<TFields, boolean>;

export type UsersUiState = {
  editErrors: EditErrors<"name" | "email">;
  editValues: { name: string; email: string; password: string } | null;
  filterText: string;
  filterItems: UserResponseDto[];
  editingId: number | null;
  sorter: "number_sorter" | "name_sorter" | "email_sorter" | string;
};

export type EventsUiState = {
  editErrors: EditErrors<"name" | "date" | "location" | "capacity" | "description">;
  editValues: { name: string; date: string; location: string; capacity: string; description?: string } | null;
  filterText: string;
  filterItems: EventResponseDto[];
  editingId: number | null;
  sorter: "number_sorter" | "name_sorter" | "capacity_sorter" | "date_sorter" | string;
};

export interface AuthState {
  user: TokenPayload | null;
  userInfo: Partial<UserResponseDto>;
  isLoading: boolean;
  error: ScreenError;
  lastVisitedPage: string | null;
  // The store augments auth with screenError during runtime; keep it permissive
  screenError?: ScreenError;
}

export interface SliceBase<TItem> {
  list: TItem[];
  isLoading: boolean;
  isSubmitting: boolean;
  isEmpty: boolean;
  screenError: ScreenError;
}

export interface EventsSlice extends SliceBase<EventResponseDto> {
  ui: EventsUiState;
  form: FormState<EventsFormValues>;
}

export interface UsersSlice extends SliceBase<UserResponseDto> {
  ui: UsersUiState;
  form: FormState<UsersFormValues>;
}

export interface LoginSlice extends SliceBase<unknown> {
  ui: UsersUiState; // reuse shape for simplicity (not used for login table)
  form: FormState<LoginFormValues>;
}

export interface UserRegistrationsSlice extends SliceBase<unknown> {
  ui: UsersUiState; // same UI shape for edit highlighting
  form: FormState<RegistrationFormValues>;
}

export interface RegistrationSlice extends SliceBase<RegistrationResponseDto> {}

export interface AppState {
  auth: AuthState;
  events: EventsSlice;
  users: UsersSlice;
  login: LoginSlice;
  registration: RegistrationSlice;
  userRegistrations: UserRegistrationsSlice;
}

export const initialState: AppState = {
  auth: {
    user: null,
    userInfo: {},
    isLoading: true,
    error: null,
    lastVisitedPage: null,
  },
  events: {
    list: [],
    isLoading: false,
    isSubmitting: false,
    isEmpty: false,
    screenError: null,
    // Початково всі поля вважаємо валідними (true)
    ui: {
      editErrors: {
        name: true,
        date: true,
        location: true,
        capacity: true,
        description: true,
      },
      editValues: null,
      filterText: "",
      filterItems: [],
      editingId: null,
      sorter: "number_sorter",
    },
    form: {
      values: {
        name: "",
        date: "",
        location: "",
        capacity: "",
        description: "",
      },
      touched: {},
      errors: {},
      isValid: true,
      generalError: null,
    },
  },
  users: {
    list: [],
    isLoading: false,
    isSubmitting: false,
    isEmpty: false,
    screenError: null,
    ui: {
      editErrors: {
        name: true,
        email: true,
      },
      editValues: null,
      filterText: "",
      filterItems: [],
      editingId: null,
      sorter: "number_sorter",
    },
    form: {
      values: {
        name: "",
        email: "",
        password: "",
      },
      touched: {},
      errors: {},
      isValid: true,
      generalError: null,
    },
  },
  login: {
    list: [],
    isLoading: false,
    isSubmitting: false,
    isEmpty: false,
    screenError: null,
    ui: {
      // UI-форма логіну не використовує editErrors у таблиці, але тип той самий
      editErrors: {
        name: true,
        email: true,
      },
      editValues: null,
      filterText: "",
      filterItems: [],
      editingId: null,
      sorter: "number_sorter",
    },
    form: {
      values: {
        name: "",
        email: "",
        password: "",
      },
      touched: {},
      errors: {},
      isValid: true,
      generalError: null,
    },
  },
  registration: {
    list: [],
    isLoading: false,
    isSubmitting: false,
    isEmpty: false,
    screenError: null,
  },
  userRegistrations: {
    list: [],
    isLoading: false,
    isSubmitting: false,
    isEmpty: false,
    screenError: null,
    ui: {
      editErrors: {
        name: true,
        email: true,
      },
      editValues: null,
      filterText: "",
      filterItems: [],
      editingId: null,
      sorter: "number_sorter",
    },
    form: {
      values: {
        name: "",
        email: "",
        password: "",
      },
      touched: {},
      errors: {},
      isValid: true,
      generalError: null,
    },
  },
};
