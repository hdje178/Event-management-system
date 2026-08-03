import { initialState, type AppState } from "./initialState.js";
import { runAnimationAlert } from "../utils/utils.js";
import {
  validateEditEventsTable,
  validateEditUsersTable,
  validateEventsForm,
  validateLoginForm,
  validateRegistrationForm,
  validateUsersForm,
} from "./validation.js";
import { getEvents, createEvents, updateEventsPatch, deleteEvent } from "../api/events.endpoints.js";
import { createUsers, deleteUser, getUsers, updateUserPatch } from "../api/users.endpoints.js";
import {
  getMyRegistration,
  addRegistrations,
  deleteRegistration as deleteRegistrationApi,
  getRegistrations,
} from "../api/registration.endpoints.js";
import { tokenStore } from "./auth_store.js";
import { GetMe, Logout, Login, Register, Refresh, GetMyProfile } from "../api/client.auth.js";
import type { CreateUserDto } from "../types/user.types.js";
import type { CreateEventDto, UpdateEventPatchDto } from "../types/event.types.js";

type Listener = (state: AppState) => void;

let listeners: Listener[] = [];
let nextId = Number(localStorage.getItem("lr1_nextId") ?? "1");
let usersController: AbortController | null = null;
let eventsController: AbortController | null = null;
let usersReqId = 0;
let eventsReqId = 0;
let myRegsController: AbortController | null = null;
let allRegsController: AbortController | null = null;
let myRegsReqId = 0;
let allRegsReqId = 0;

function createTimeoutSignal(signal?: AbortSignal, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  signal?.addEventListener("abort", () => {
    controller.abort();
    clearTimeout(timeoutId);
  });
  return { signal: controller.signal, clear: () => clearTimeout(timeoutId) } as const;
}

let state: AppState = structuredClone(initialState);

function getErrorMessage(details: unknown): string | undefined {
  if (details && typeof details === "object") {
    const err = (details as Record<string, unknown>)["error"];
    if (err && typeof err === "object") {
      const msg = (err as Record<string, unknown>)["message"];
      if (typeof msg === "string") return msg;
    }
  }
  return undefined;
}

export function createStore() {
  async function addUsers(item: CreateUserDto): Promise<boolean> {
    store.setState({
      users: {
        ...state.users,
        isLoading: true,
        screenError: null,
      },
    });
    try {
      const res = await createUsers(item);
      if (!res.ok) {
        store.setState({
          users: {
            ...state.users,
            screenError: res.error,
            isLoading: false,
          },
        });
        {
          const d = res.error.details as { error?: { message?: string } } | undefined;
          runAnimationAlert(store, d?.error?.message ?? "Помилка додавання користувача");
        }
        return false;
      }
      await store.loadUsers();
      return true;
    } catch {
      store.setState({
        users: {
          ...state.users,
          screenError: "Unexpected error",
          isLoading: false,
        },
      });
      return false;
    }
  }

  async function addRegistration(eventId: string | number): Promise<boolean> {
    if (!state.auth.user) {
      runAnimationAlert(store, "Увійдіть, щоб зареєструватись");
      window.location.href = `/pages/login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
      return false;
    }
    try {
      state.registration.isSubmitting = true;
      listeners.forEach((fn) => fn(state));
      const res = await addRegistrations({ eventId: String(eventId) });
      if (!res.ok) {
        state.registration.isSubmitting = false;
        state.registration.screenError = res.error;
        listeners.forEach((fn) => fn(state));
        {
          const d = res.error.details as { error?: { message?: string } } | undefined;
          runAnimationAlert(store, d?.error?.message || "Не вдалося зареєструватись");
        }
        return false;
      }
      runAnimationAlert(store, "Ви успішно зареєструвалися ✅");
      state.registration.isSubmitting = false;
      await store.loadMyRegistrations();
      await store.loadEvents();
      return true;
    } catch {
      state.registration.isSubmitting = false;
      listeners.forEach((fn) => fn(state));
      runAnimationAlert(store, "Неочікувана помилка");
      return false;
    }
  }

  async function addEvents(item: CreateEventDto): Promise<boolean> {
    store.setState({
      events: {
        ...state.events,
        isLoading: true,
        screenError: null,
      },
    });
    console.log("addEvents: ", item, " nextId: ", nextId);
    try {
      const res = await createEvents(item);
      if (!res.ok) {
        store.setState({
          events: {
            ...state.events,
            screenError: res.error,
            isLoading: false,
          },
        });
        {
          const d = res.error.details as { error?: { message?: string } } | undefined;
          runAnimationAlert(store, d?.error?.message ?? "Помилка створення події");
        }
        return false;
      }
      await store.loadEvents();
      return true;
    } catch {
      store.setState({
        events: {
          ...state.events,
          screenError: "Unexpected error",
          isLoading: false,
        },
      });
      return false;
    }
  }

  const store = {
    getState: (): AppState => state,
    setState: (newState: Partial<AppState>): void => {
      state = { ...state, ...newState } as AppState;
      listeners.forEach((fn) => fn(state));
    },
    addRegistration: (eventId: string | number) => addRegistration(eventId),
    checkAuth: async () => {
      console.log("checkAuth START", Date.now());
      store.setState({ auth: { ...state.auth, isLoading: true, screenError: null } as any });
      try {
        if (!tokenStore.get()) {
          const refreshRes = await Refresh();
          if (refreshRes.ok) tokenStore.set(refreshRes.data.accessToken);
        }
        const res = await GetMe();
        if (res.ok) {
          store.setState({
            auth: {
              ...state.auth,
              user: res.data.user,
              isLoading: false,
              screenError: null,
            } as any,
          });
          const profileRes = await GetMyProfile();
          if (profileRes.ok) {
            store.setState({
              auth: {
                ...state.auth,
                userInfo: profileRes.data.user,
                isLoading: false,
              } as any,
            });
          }
        } else {
          tokenStore.clear();
          store.setState({
            auth: {
              ...state.auth,
              user: null,
              isLoading: false,
              screenError: res.error as any,
            } as any,
          });
        }
        return res;
      } catch {
        tokenStore.clear();
        store.setState({ auth: { ...state.auth, isLoading: false, screenError: "Unexpected error", user: null } as any });
      }
    },
    loadUsers: async (): Promise<void> => {
      if (usersController) usersController.abort();
      usersController = new AbortController();
      const timeout = createTimeoutSignal(usersController.signal, 10000);
      const reqId = ++usersReqId;

      store.setState({ users: { ...state.users, isLoading: true, screenError: null } as any });
      const params = new URLSearchParams();
      if (state.users.ui.filterText) params.append("search", state.users.ui.filterText);
      if (state.users.ui.sorter) params.append("sortBy", state.users.ui.sorter);

      try {
        const res = await getUsers(params.toString(), timeout.signal);
        await new Promise((r) => setTimeout(r, 500));
        if (reqId !== usersReqId) {
          store.setState({ users: { ...state.users, isLoading: false } as any });
          return;
        }
        if (!res.ok) {
          store.setState({ users: { ...state.users, screenError: res.error, isLoading: false } as any });
          {
            const d = res.error.details as { error?: { message?: string } } | undefined;
            runAnimationAlert(store, d?.error?.message || "Помилка завантаження користувачів");
          }
          return;
        }
        store.setState({ users: { ...state.users, list: res.data.data, isLoading: false } as any });
        console.log("users:", res.data.data);
      } catch (e) {
        const err = e as { name?: string };
        if (err?.name !== "AbortError") {
          store.setState({ users: { ...state.users, screenError: "Unexpected error", isLoading: false } as any });
        }
      } finally {
        timeout.clear();
      }
    },
    loadEvents: async (): Promise<void> => {
      if (eventsController) eventsController.abort();
      eventsController = new AbortController();
      const timeout = createTimeoutSignal(eventsController.signal, 10000);
      const reqId = ++eventsReqId;

      store.setState({ events: { ...state.events, isLoading: true, screenError: null } as any });
      const params = new URLSearchParams();
      if (state.events.ui.filterText) params.append("search", state.events.ui.filterText);
      if (state.events.ui.sorter) params.append("sortBy", state.events.ui.sorter);

      try {
        const res = await getEvents(params.toString(), timeout.signal);
        if (reqId !== eventsReqId) {
          store.setState({ events: { ...state.events, isLoading: false } as any });
          return;
        }
        if (!res.ok) {
          store.setState({ events: { ...state.events, screenError: res.error, isLoading: false } as any });
          {
            const d = res.error.details as { error?: { message?: string } } | undefined;
            runAnimationAlert(store, d?.error?.message || "Помилка завантаження подій");
          }
          return;
        }
        store.setState({ events: { ...state.events, list: res.data.data, isLoading: false } as any });
      } catch (e) {
        const err = e as { name?: string };
        if (err?.name !== "AbortError") {
          store.setState({ events: { ...state.events, screenError: "Unexpected error", isLoading: false } as any });
        }
      } finally {
        timeout.clear();
      }
    },
    loadMyRegistrations: async (): Promise<void> => {
      if (!state.auth.user) return;
      if (myRegsController) myRegsController.abort();
      myRegsController = new AbortController();
      const timeout = createTimeoutSignal(myRegsController.signal, 10000);
      const reqId = ++myRegsReqId;

      store.setState({ registration: { ...state.registration, isLoading: true, screenError: null } as any });
      try {
        const res = await getMyRegistration(timeout.signal);
        if (reqId !== myRegsReqId) {
          store.setState({ registration: { ...state.registration, isLoading: false } as any });
          return;
        }
        if (!res.ok) {
          store.setState({ registration: { ...state.registration, screenError: res.error, isLoading: false } as any });
          return;
        }
        const items = res.ok ? res.data.data : [];
        store.setState({ registration: { ...state.registration, list: items, isLoading: false } as any });
      } catch (e) {
        const err = e as { name?: string };
        if (err?.name !== "AbortError") {
          store.setState({ registration: { ...state.registration, screenError: "Unexpected error", isLoading: false } as any });
        }
      } finally {
        timeout.clear();
      }
    },

    loadAllRegistrations: async (): Promise<void> => {
      if (state.auth.user?.role?.toLowerCase() !== "admin") return;
      if (allRegsController) allRegsController.abort();
      allRegsController = new AbortController();
      const timeout = createTimeoutSignal(allRegsController.signal, 10000);
      const reqId = ++allRegsReqId;

      store.setState({ registration: { ...state.registration, isLoading: true, screenError: null } as any });
      try {
        const res = await getRegistrations(timeout.signal);
        if (reqId !== allRegsReqId) {
          store.setState({ registration: { ...state.registration, isLoading: false } as any });
          return;
        }
        if (!res.ok) {
          store.setState({ registration: { ...state.registration, screenError: res.error, isLoading: false } as any });
          return;
        }
        const items = res.ok ? res.data.data : [];
        store.setState({ registration: { ...state.registration, list: items, isLoading: false } as any });
        console.log("allRegs:", items);
      } catch (e) {
        const err = e as { name?: string };
        if (err?.name !== "AbortError") {
          store.setState({ registration: { ...state.registration, screenError: "Unexpected error", isLoading: false } as any });
        }
      } finally {
        timeout.clear();
      }
    },
    deleteUsers: async (id: number | string): Promise<void> => {
      store.setState({ users: { ...state.users, isLoading: true, screenError: null } as any });
      try {
        const res = await deleteUser(id);
        if (!res.ok) {
          store.setState({ users: { ...state.users, screenError: res.error, isLoading: false } as any });
          {
            const d = res.error.details as { error?: { message?: string } } | undefined;
            runAnimationAlert(store, d?.error?.message ?? "Помилка видалення користувача");
          }
          return;
        }
        store.setState({
          users: {
            ...state.users,
            list: state.users.list.filter((e) => e.id !== (id as number)),
            screenError: null,
            isLoading: false,
          } as any,
        });
        runAnimationAlert(store, "Успішно видалено!✅");
      } catch {
        store.setState({ users: { ...state.users, screenError: "Unexpected error", isLoading: false } as any });
      }
    },
    deleteRegistration: async (id: number | string): Promise<boolean> => {
      try {
        const res = await deleteRegistrationApi(id);
        if (!res.ok) {
          const d = res.error.details as { error?: { message?: string } } | undefined;
          runAnimationAlert(store, d?.error?.message || "Помилка скасування");
          return false;
        }
        const isAdmin = state.auth.user?.role?.toLowerCase() === "admin";
        await (isAdmin ? store.loadAllRegistrations() : store.loadMyRegistrations());
        runAnimationAlert(store, "Реєстрацію скасовано ✅");
        return true;
      } catch {
        runAnimationAlert(store, "Неочікувана помилка");
        return false;
      }
    },
    deleteEvents: async (id: number | string): Promise<void> => {
      store.setState({ events: { ...state.events, isLoading: true, screenError: null } as any });
      try {
        const res = await deleteEvent(id);
        if (!res.ok) {
          store.setState({ events: { ...state.events, screenError: res.error, isLoading: false } as any });
          const d = res.error.details as { error?: { message?: string } } | undefined;
          runAnimationAlert(store, d?.error?.message ?? "Помилка видалення події");
          return;
        }

        store.setState({
          events: {
            ...state.events,
            list: state.events.list.filter((e) => e.id !== (id as number)),
            screenError: null,
            isLoading: false,
          } as any,
        });
        runAnimationAlert(store, "Успішно видалено!✅");
      } catch {
        store.setState({ events: { ...state.events, screenError: "Unexpected error", isLoading: false } as any });
      }
    },
    resetSearch: (): void => {
      state.events.ui.filterText = "";
      state.events.ui.filterItems = [];
      listeners.forEach((fn) => fn(state));
    },
    saveUsers: async (
      id: number | string,
      values: { name: string; email: string; password?: string },
    ): Promise<void> => {
      state.users.ui.editErrors = validateEditUsersTable(values) as any;

      const isValid = Object.values(state.users.ui.editErrors).every((v) => v === true);
      console.log("isValid:", isValid);

      if (!isValid) {
        listeners.forEach((fn) => fn(state));
        runAnimationAlert(store, "Неправильний формат данних в виділених колонках, збереження не можливе!");
        return;
      }
      const payload = {
        name: values.name,
        email: values.email,
      } as const;
      store.setState({ users: { ...state.users, isLoading: true, screenError: null } as any });
      try {
        const res = await updateUserPatch(id, payload);
        if (!res.ok) {
          const err: any = res.error ?? {};

          const message = err?.details?.error?.message || err?.message || "Помилка збереження";

          const isConflict = err.status === 409 || err.code === "CONFLICT" || err.kind === "conflict";

          const nextEditErrors: Record<string, boolean> = { ...state.users.ui.editErrors } as any;
          if (isConflict) {
            nextEditErrors.email = false;
          }
          state.users.ui.editErrors = nextEditErrors as any;
          store.setState({ users: { ...state.users, screenError: err, isLoading: false } as any });

          runAnimationAlert(store, message);
          return;
        }
        await store.loadUsers();
      } catch {
        store.setState({ users: { ...state.users, screenError: "Unexpected error", isLoading: false } as any });
        runAnimationAlert(store, "Unexpected error");
      }
      state.users.ui.editingId = null;
      state.users.ui.editValues = null;
      state.users.ui.editErrors = structuredClone(initialState.users.ui.editErrors) as any;

      listeners.forEach((fn) => fn(state));
      runAnimationAlert(store, "Успішно збережено!✅");
    },
    saveEvents: async (
      id: number | string,
      values: { name: string; date: string; location: string; capacity: string | number; description?: string },
    ): Promise<void> => {
      state.events.ui.editErrors = validateEditEventsTable(values) as any;

      const isValid = Object.values(state.events.ui.editErrors).every((v) => v === true);
      console.log("isValid:", isValid);

      if (!isValid) {
        listeners.forEach((fn) => fn(state));
        runAnimationAlert(store, "Неправильний формат данних в виділених колонках, збереження не можливе!");
        return;
      }

      const payload: UpdateEventPatchDto = {
        name: values.name.trim(),
        date: values.date,
        location: values.location.trim(),
        capacity: Number(values.capacity),
        description: values.description?.trim() || "-",
      } as UpdateEventPatchDto;

      if (!payload.date || !Number.isFinite(payload.capacity)) {
        listeners.forEach((fn) => fn(state));
        return;
      }

      store.setState({
        events: { ...state.events, isLoading: true, screenError: null } as any,
      });

      try {
        const res = await updateEventsPatch(id, payload);
        if (!res.ok) {
          const err: any = res.error ?? {};

          const message = err?.details?.error?.message || err?.message || "Помилка збереження";

          const isConflict = err.status === 409 || err.code === "CONFLICT" || err.kind === "conflict";

          const nextEditErrors: Record<string, boolean> = { ...state.events.ui.editErrors } as any;
          if (isConflict) {
            nextEditErrors.name = false;
          }
          state.events.ui.editErrors = nextEditErrors as any;
          store.setState({ events: { ...state.events, screenError: err, isLoading: false } as any });

          runAnimationAlert(store, message);
          return;
        }

        await store.loadEvents();
      } catch {
        store.setState({ events: { ...state.events, screenError: "Unexpected error", isLoading: false } as any });
      }
      state.events.ui.editingId = null;
      state.events.ui.editValues = null;
      state.events.ui.editErrors = structuredClone(initialState.events.ui.editErrors) as any;

      listeners.forEach((fn) => fn(state));
      runAnimationAlert(store, "Успішно збережено!✅");
    },
    editUsers: (id: number): void => {
      state.users.ui.editingId = id;
      const item = state.users.list.find((e) => e.id === id)!;
      state.users.ui.editValues = {
        name: item.name,
        email: item.email,
        password: (item as any).password,
      } as any;
      listeners.forEach((fn) => fn(state));
    },
    editEvents: (id: number): void => {
      state.events.ui.editingId = id;
      const item = state.events.list.find((e) => e.id === id)!;
      state.events.ui.editValues = {
        name: item.name,
        date: new Date(item.date).toLocaleDateString("uk-UA"),
        location: item.location,
        capacity: String(item.capacity),
        description: item.description ?? "-",
      };
      listeners.forEach((fn) => fn(state));
    },
    setFilterTextUsers: (text: string): void => {
      state.users.ui.filterText = text;
      state.users.ui.filterItems = state.users.list.filter((item) => item.name.toLowerCase().includes(text.toLowerCase()));
      listeners.forEach((fn) => fn(state));
    },
    setFilterTextEvents: (text: string): void => {
      state.events.ui.filterText = text;
      state.events.ui.filterItems = state.events.list.filter((item) => item.name.toLowerCase().includes(text.toLowerCase()));
      listeners.forEach((fn) => fn(state));
    },
    setSorterUsers: (sort: string): void => {
      state.users.ui.sorter = sort;
      if (state.users.ui.sorter === "number_sorter") {
        state.users.list.sort((a, b) => b.id - a.id);
      } else if (state.users.ui.sorter === "name_sorter") {
        state.users.list.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
      } else if (state.users.ui.sorter === "email_sorter") {
        state.users.list.sort((a, b) => a.email.toLowerCase().localeCompare(b.email.toLowerCase()));
      }
    },
    setSorterEvents: (sort: string): void => {
      state.events.ui.sorter = sort;
      if (state.events.ui.sorter === "number_sorter") {
        state.events.list.sort((a, b) => b.id - a.id);
      } else if (state.events.ui.sorter === "date_sorter") {
        state.events.list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      } else if (state.events.ui.sorter === "name_sorter") {
        state.events.list.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
      } else if (state.events.ui.sorter === "capacity_sorter") {
        state.events.list.sort((a, b) => a.capacity - b.capacity);
      }
      listeners.forEach((fn) => fn(state));
    },
    updateFieldUsers: (name: string, value: string): void => {
      state.users.form.touched[name] = true;
      // @ts-expect-error index assignment
      state.users.form.values[name] = value as any;
      state.users.form.errors = validateUsersForm(state.users.form as any) as any;
      state.users.form.isValid = Object.keys(state.users.form.errors).length === 0;
      listeners.forEach((fn) => fn(state));
    },
    updateFieldLogin: (name: string, value: string): void => {
      state.login.form.touched[name] = true;
      // @ts-expect-error index assignment
      state.login.form.values[name] = value as any;
      state.login.form.errors = validateLoginForm(state.login.form as any) as any;
      state.login.form.isValid = Object.keys(state.login.form.errors).length === 0;
      listeners.forEach((fn) => fn(state));
    },
    updateFieldRegistration: (name: string, value: string): void => {
      state.userRegistrations.form.touched[name] = true;
      // @ts-expect-error index assignment
      state.userRegistrations.form.values[name] = value as any;
      state.userRegistrations.form.errors = validateRegistrationForm(state.userRegistrations.form as any) as any;
      state.userRegistrations.form.isValid = Object.keys(state.userRegistrations.form.errors).length === 0;
      listeners.forEach((fn) => fn(state));
    },
    updateFieldEvents: (name: string, value: string): void => {
      state.events.form.touched[name] = true;
      // @ts-expect-error index assignment
      state.events.form.values[name] = value as any;
      state.events.form.errors = validateEventsForm(state.events.form as any) as any;
      state.events.form.isValid = Object.keys(state.events.form.errors).length === 0;
      listeners.forEach((fn) => fn(state));
    },
    submitFormUsers: async (): Promise<void> => {
      state.users.form.touched = {
        name: true,
        email: true,
        password: true,
      } as any;
      const errors = validateUsersForm(state.users.form as any) as any;
      state.users.form.errors = errors;
      state.users.form.isValid = Object.keys(errors).length === 0;

      if (!state.users.form.isValid) {
        listeners.forEach((fn) => fn(state));
        return;
      }
      console.log(state.users.form.values);
      const toAdd: CreateUserDto = {
        name: (state.users.form.values as any).name,
        email: (state.users.form.values as any).email,
        password: (state.users.form.values as any).password,
      };
      const res = await addUsers(toAdd).catch((e) => console.error("Error adding user:", e));
      if (!res) {
        listeners.forEach((fn) => fn(state));
        runAnimationAlert(store, "Не вдалось додати!");
        return;
      }
      state.users.form = structuredClone(initialState.users.form) as any;
      state.users.ui.filterItems = state.users.list.filter((item) =>
        item.name.toLowerCase().includes(state.users.ui.filterText.toLowerCase()),
      );
      listeners.forEach((fn) => fn(state));
      runAnimationAlert(store, "Запис успішно створений✅!");
    },
    submitFormLogin: async (): Promise<void> => {
      state.login.form.touched = {
        email: true,
        password: true,
      } as any;
      const errors = validateLoginForm(state.login.form as any) as any;
      state.login.form.errors = errors;
      state.login.form.isValid = Object.keys(errors).length === 0;

      if (!state.login.form.isValid) {
        listeners.forEach((fn) => fn(state));
        return;
      }
      const toAdd = {
        email: (state.login.form.values as any).email,
        password: (state.login.form.values as any).password,
      };
      const res = await Login(toAdd);
      console.log(res);
      if (!res.ok) {
        (state.login.form as any).generalError = (res.error as any)?.details?.error?.message ?? "Сталась невідома помилка";
        listeners.forEach((fn) => fn(state));
        runAnimationAlert(store, (res.error as any)?.details?.error?.message || "Помилка регістрації");
        return;
      }

      (state.auth as any) = {
        ...state.auth,
        name: (res.data as any).name,
      };
      state.login.form = structuredClone(initialState.login.form) as any;
      listeners.forEach((fn) => fn(state));
      runAnimationAlert(store, `Вітаємо, ${(res.data as any).user.name ? (res.data as any).user.name : "користувачу"}!`);
      const params = new URLSearchParams(window.location.search);
      const redirectPage = params.get("redirect") || "/pages/events.html";
      if (
        redirectPage.includes("login") ||
        redirectPage.includes("register") ||
        redirectPage.includes("logout") ||
        redirectPage.includes("users")
      ) {
        window.location.href = "/pages/events.html";
        return;
      }
      window.location.href = redirectPage;
    },
    submitFormRegistration: async (): Promise<void> => {
      state.userRegistrations.form.touched = {
        name: true,
        email: true,
        password: true,
      } as any;
      const errors = validateRegistrationForm(state.login.form as any) as any;
      state.userRegistrations.form.errors = errors;
      state.userRegistrations.form.isValid = Object.keys(errors).length === 0;

      if (!state.userRegistrations.form.isValid) {
        listeners.forEach((fn) => fn(state));
        return;
      }
      const toRegister = {
        name: (state.userRegistrations.form.values as any).name,
        email: (state.userRegistrations.form.values as any).email,
        password: (state.userRegistrations.form.values as any).password,
      };

      const res = await Register(toRegister);
      if (!res.ok) {
        (state.userRegistrations.form as any).generalError = (res.error as any)?.details?.error?.message ?? null;
        listeners.forEach((fn) => fn(state));
        runAnimationAlert(store, (res.error as any)?.details?.error?.message || "Помилка реєстрації");
        return;
      }
      const toAdd = {
        email: (state.userRegistrations.form.values as any).email,
        password: (state.userRegistrations.form.values as any).password,
      };
      const loginRes = await Login(toAdd);
      if (!loginRes.ok) {
        const errMsg = (loginRes.error as any)?.details?.error?.message || "Помилка авторизації після реєстрації";
        (state.userRegistrations.form as any).generalError = errMsg;
        listeners.forEach((fn) => fn(state));
        runAnimationAlert(store, errMsg);
        return;
      }
      (state.auth as any) = {
        ...state.auth,
        name: (res.data as any).name,
      };
      state.login.form = structuredClone(initialState.login.form) as any;
      listeners.forEach((fn) => fn(state));
      runAnimationAlert(store, `Вітаємо, ${(res.data as any).user.name ? (res.data as any).user.name : "користувачу"}!`);
      const params = new URLSearchParams(window.location.search);
      const redirectPage = params.get("redirect") || "/pages/events.html";
      if (
        redirectPage.includes("login") ||
        redirectPage.includes("register") ||
        redirectPage.includes("logout") ||
        redirectPage.includes("users")
      ) {
        window.location.href = "/pages/events.html";
        return;
      }
      window.location.href = redirectPage;
    },
    submitFormEvents: async (): Promise<void> => {
      state.events.form.touched = {
        name: true,
        date: true,
        location: true,
        capacity: true,
        description: true,
      } as any;
      const errors = validateEventsForm(state.events.form as any) as any;
      state.events.form.errors = errors;
      state.events.form.isValid = Object.keys(errors).length === 0;

      if (!state.events.form.isValid) {
        listeners.forEach((fn) => fn(state));
        return;
      }
      console.log(state.events.form.values);
      const toAdd: CreateEventDto = {
        ...(state.events.form.values as any),
        capacity: Number((state.events.form.values as any).capacity),
        description: ((state.events.form.values as any).description ?? "").trim() || "-",
      };
      const success = await addEvents(toAdd).catch((e) => console.error("Error adding event:", e));
      if (!success) return;
      state.events.form = structuredClone(initialState.events.form) as any;
      state.events.ui.filterItems = state.events.list.filter((item) =>
        item.name.toLowerCase().includes(state.events.ui.filterText.toLowerCase()),
      );
      listeners.forEach((fn) => fn(state));
      runAnimationAlert(store, "Запис успішно створений✅!");
    },
    logout: async (): Promise<void> => {
      const res = await Logout();
      if (!res.ok) {
        runAnimationAlert(store, ((res.error as any).details?.message) || res.error.message);
        return;
      }
      state.login.form = structuredClone(initialState.login.form) as any;
      (state.login.form as any).generalError = null;
      store.setState({
        auth: { ...state.auth, user: null } as any,
        login: { ...state.login, form: structuredClone(initialState.login.form) as any } as any,
      });
      listeners.forEach((fn) => fn(state));
      window.location.replace("/pages/events.html");
    },
    resetFormUsers: (): void => {
      state.users.form.touched = {} as any;
      state.users.form.values = structuredClone(initialState.users.form.values) as any;
      state.users.form.errors = structuredClone(initialState.users.form.errors) as any;
      state.users.form.isValid = true;
      listeners.forEach((fn) => fn(state));
    },
    resetFormLogin: (): void => {
      state.login.form.touched = {} as any;
      state.login.form.values = structuredClone(initialState.login.form.values) as any;
      state.login.form.errors = structuredClone(initialState.login.form.errors) as any;
      state.login.form.isValid = true;
      listeners.forEach((fn) => fn(state));
    },
    resetFormRegistration: (): void => {
      state.userRegistrations.form.touched = {} as any;
      state.userRegistrations.form.values = structuredClone(initialState.userRegistrations.form.values) as any;
      state.userRegistrations.form.errors = structuredClone(initialState.userRegistrations.form.errors) as any;
      state.userRegistrations.form.isValid = true;
      listeners.forEach((fn) => fn(state));
    },
    resetFormEvents: (): void => {
      state.events.form.touched = {} as any;
      state.events.form.values = structuredClone(initialState.events.form.values) as any;
      state.events.form.errors = structuredClone(initialState.events.form.errors) as any;
      state.events.form.isValid = true;
      listeners.forEach((fn) => fn(state));
    },
    subscribe: (fn: Listener): void => {
      listeners.push(fn);
    },
  } as const;

  return store;
}
