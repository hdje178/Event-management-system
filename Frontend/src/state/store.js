import {initialState} from "./initialState.js";
import {runAnimationAlert} from "../utils/utils.js";
import {
    validateEditEventsTable,
    validateEditUsersTable,
    validateEventsForm,
    validateLoginForm,
    validateRegistrationForm,
    validateUsersForm
} from "./validation.js";
import {getEvents, createEvents, updateEventsPatch, deleteEvent} from "../api/events.endpoints.js";
import {createUsers, deleteUser, getUsers, updateUserPatch, updateUserPut, getUser} from "../api/users.endpoints.js";
import {getRegistrationById, getMyRegistration, addRegistrations, deleteRegistration, updateRegistrationPut
, getRegistrations, updateRegistrationPatch} from "../api/registration.endpoints.js";
import {tokenStore} from "./auth_store.js";
import {GetMe, Logout, Login, Register, requestWithAuthRetry, Refresh, GetMyProfile} from "../api/client.auth.js";

let listeners = [];
let nextId = Number(localStorage.getItem("lr1_nextId") ?? "1");
let usersController = null;
let eventsController = null;
let usersReqId = 0;
let eventsReqId = 0;
let myRegsController = null;
let allRegsController = null;
let myRegsReqId = 0;
let allRegsReqId = 0;

function createTimeoutSignal(signal, timeoutMs = 10000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    signal?.addEventListener("abort", () => { controller.abort(); clearTimeout(timeoutId); });
    return { signal: controller.signal, clear: () => clearTimeout(timeoutId) };
}
let state = structuredClone(initialState);

export function createStore() {
    async function addUsers(item){
        store.setState({
            users: {
                ...state.users,
                isLoading: true,
                screenError: null
            }
        });
        try{
            const res = await createUsers(item);
            if (!res.ok) {
                store.setState({
                    users: {
                        ...state.users,
                        screenError: res.error,
                        isLoading: false
                    }
                });
                runAnimationAlert(store, res.error.details.error.message)
                return false;
            }
            await store.loadUsers();
            return true;
        }catch (e){
            store.setState({
                users: {
                    ...state.users,
                    screenError: "Unexpected error",
                    isLoading: false
                }
            })
            return false;
        }
    }
    async function addRegistration(eventId){
        if (!state.auth.user) {
            runAnimationAlert(store, "Увійдіть, щоб зареєструватись");
            window.location.href = `/pages/login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
            return false;
        }
        try {
            state.registrations.isSubmitting = true; listeners.forEach(fn => fn(state));
            const res = await addRegistrations({ eventId: String(eventId) });
            if (!res.ok) {
                state.registrations.isSubmitting = false;
                state.registrations.screenError = res.error;
                listeners.forEach(fn => fn(state));
                runAnimationAlert(store, res.error?.details?.error?.message || "Не вдалося зареєструватись");
                return false;
            }
            runAnimationAlert(store, "Ви успішно зареєструвалися ✅");
            state.registrations.isSubmitting = false;
            await store.loadMyRegistrations();
            await store.loadEvents();
            return true;
        } catch (e) {
            state.registrations.isSubmitting = false; listeners.forEach(fn => fn(state));
            runAnimationAlert(store, "Неочікувана помилка");
            return false;
        }
    }
    async function addEvents(item) {
        store.setState({
            events: {
                ...state.events,
                isLoading: true,
                screenError: null
            }
        });
        console.log("addEvents: ", item, " nextId: ", nextId)
        try{
            const res = await createEvents(item);
            if (!res.ok) {
                store.setState({
                    events: {
                        ...state.events,
                        screenError: res.error,
                        isLoading: false
                    }
                });
                runAnimationAlert(store, res.error.details.error.message)
                return false;
            }
            await store.loadEvents();
            return true;
        }catch (e){
            store.setState({
                events: {
                    ...state.events,
                    screenError: "Unexpected error",
                    isLoading: false
                }
            })
            return false;
        }
    }
    const store = {
        getState: () => state,
        setState: (newState) => {
            state = {...state, ...newState};
            listeners.forEach(fn => fn(state));
        },
        addRegistration: eventId => addRegistration(eventId),
        checkAuth: async () => {
            console.log('checkAuth START', Date.now());
            store.setState({auth: {...state.auth, isLoading: true, screenError: null  }})
            try{
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
                        }
                    });
                    const profileRes = await GetMyProfile();
                    if (profileRes.ok) {
                        store.setState({
                            auth: {
                                ...state.auth,
                                userInfo: profileRes.data.user,
                                isLoading: false
                            }
                        });
                    }
                } else {
                    tokenStore.clear();
                    store.setState({
                        auth: {
                            ...state.auth,
                            user: null,
                            isLoading: false,
                            screenError: res.error,
                        }
                    });
                }
                return res;
            }catch (e){
                tokenStore.clear();
                store.setState({auth: {...state.auth, isLoading: false, screenError: "Unexpected error", user: null }});
            }

        },
        loadUsers: async () => {
            if (usersController) usersController.abort();
            usersController = new AbortController();
            const timeout = createTimeoutSignal(usersController.signal, 10000);
            const reqId = ++usersReqId;

            store.setState({ users: { ...state.users, isLoading: true, screenError: null } });
            const params = new URLSearchParams();
            if (state.users.ui.filterText) params.append("search", state.users.ui.filterText);
            if (state.users.ui.sorter) params.append("sortBy", state.users.ui.sorter);

            try {
                const res = await getUsers(params.toString(), timeout.signal);
                await new Promise(r => setTimeout(r, 500));
                if (reqId !== usersReqId) {
                    store.setState({ users: { ...state.users, isLoading: false } });
                    return;
                }
                if (!res.ok) {
                    store.setState({ users: { ...state.users, screenError: res.error, isLoading: false } });
                    runAnimationAlert(store, res.error?.details?.error?.message || "Помилка завантаження користувачів");
                    return;
                }
                store.setState({ users: { ...state.users, list: res.data?.data ?? res.data ?? [], isLoading: false } });
                console.log("users:", res.data?.data ?? res.data ?? [])
            } catch (e) {
                if (e?.name !== 'AbortError') {
                    store.setState({ users: { ...state.users, screenError: "Unexpected error", isLoading: false } });
                }
            } finally {
                timeout.clear();
            }
        },
        loadEvents: async () => {
            if (eventsController) eventsController.abort();
            eventsController = new AbortController();
            const timeout = createTimeoutSignal(eventsController.signal, 10000);
            const reqId = ++eventsReqId;

            store.setState({ events: { ...state.events, isLoading: true, screenError: null } });
            const params = new URLSearchParams();
            if (state.events.ui.filterText) params.append("search", state.events.ui.filterText);
            if (state.events.ui.sorter) params.append("sortBy", state.events.ui.sorter);

            try {
                const res = await getEvents(params.toString(), timeout.signal);
                if (reqId !== eventsReqId) { store.setState({ events: { ...state.events, isLoading: false } }); return; }
                if (!res.ok) {
                    store.setState({ events: { ...state.events, screenError: res.error, isLoading: false } });
                    runAnimationAlert(store, res.error?.details?.error?.message || "Помилка завантаження подій");
                    return;
                }
                store.setState({ events: { ...state.events, list: res.data?.data ?? res.data ?? [], isLoading: false } });
            } catch (e) {
                if (e?.name !== 'AbortError') {
                    store.setState({ events: { ...state.events, screenError: "Unexpected error", isLoading: false } });
                }
            } finally { timeout.clear(); }
        },
        loadMyRegistrations: async () => {
            if (!state.auth.user) return;
            if (myRegsController) myRegsController.abort();
            myRegsController = new AbortController();
            const timeout = createTimeoutSignal(myRegsController.signal, 10000);
            const reqId = ++myRegsReqId;

            store.setState({ registrations: { ...state.registrations, isLoading: true, screenError: null } });
            try {
                const res = await getMyRegistration(undefined, timeout.signal);
                if (reqId !== myRegsReqId) { store.setState({ registrations: { ...state.registrations, isLoading: false } }); return; }
                if (!res.ok) {
                    store.setState({ registrations: { ...state.registrations, screenError: res.error, isLoading: false } });
                    return;
                }
                const items = res.data?.data ?? res.data ?? [];
                store.setState({ registrations: { ...state.registrations, list: items, isLoading: false } });
            } catch (e) {
                if (e?.name !== 'AbortError') {
                    store.setState({ registrations: { ...state.registrations, screenError: "Unexpected error", isLoading: false } });
                }
            } finally {
                timeout.clear();
            }
        },

        loadAllRegistrations: async () => {
            if (state.auth.user?.role?.toLowerCase() !== 'admin') return;
            if (allRegsController) allRegsController.abort();
            allRegsController = new AbortController();
            const timeout = createTimeoutSignal(allRegsController.signal, 10000);
            const reqId = ++allRegsReqId;

            store.setState({ registrations: { ...state.registrations, isLoading: true, screenError: null } });
            try {
                const res = await getRegistrations(undefined, timeout.signal);
                if (reqId !== allRegsReqId) { store.setState({ registrations: { ...state.registrations, isLoading: false } }); return; }
                if (!res.ok) {
                    store.setState({ registrations: { ...state.registrations, screenError: res.error, isLoading: false } });
                    return;
                }
                const items = res.data?.data ?? res.data ?? [];
                store.setState({ registrations: { ...state.registrations, list: items, isLoading: false } });
                console.log("allRegs:", items)
            } catch (e) {
                if (e?.name !== 'AbortError') {
                    store.setState({ registrations: { ...state.registrations, screenError: "Unexpected error", isLoading: false } });
                }
            } finally {
                timeout.clear();
            }
        },
        deleteUsers: async (id) => {
            store.setState({users: { ...state.users, isLoading: true, screenError: null }});
            try{
                const res = await deleteUser(id)
                if (!res.ok){
                    store.setState({users: { ...state.users, screenError: res.error, isLoading: false }});
                    runAnimationAlert(store, res.error.details.error.message)
                    return;
                }
                store.setState({
                    users: {
                        ...state.users,
                        list: state.users.list.filter(e=> e.id !== id),
                        screenError: null,
                        isLoading: false
                    }
                });
                runAnimationAlert(store, "Успішно видалено!✅");
            }catch (e){
                store.setState({ users: { ...state.users, screenError: "Unexpected error", isLoading: false } });
            }
        },
        deleteRegistration: async (id) => {
            try {
                const res = await deleteRegistration(id);
                if (!res.ok) {
                    runAnimationAlert(store, res.error?.details?.error?.message || "Помилка скасування");
                    return false;
                }
                const isAdmin = state.auth.user?.role?.toLowerCase() === 'admin';
                await (isAdmin ? store.loadAllRegistrations() : store.loadMyRegistrations());
                runAnimationAlert(store, "Реєстрацію скасовано ✅");
                return true;
            } catch (e) {
                runAnimationAlert(store, "Неочікувана помилка");
                return false;
            }
        },
        deleteEvents: async (id) => {
            store.setState({ events: { ...state.events, isLoading: true, screenError: null } });
            try {
                const res = await deleteEvent(id)
                if (!res.ok) {
                    store.setState({ events: { ...state.events, screenError: res.error, isLoading: false } });
                    runAnimationAlert(store, res.error.details.error.message)
                    return;
                }

                store.setState({
                    events: {
                        ...state.events,
                        list: state.events.list.filter(e=> e.id !== id),
                        screenError: null,
                        isLoading: false
                    }
                });
                runAnimationAlert(store, "Успішно видалено!✅");
            }
            catch (e) {
                store.setState({ events: { ...state.events, screenError: "Unexpected error", isLoading: false } });
            }
        },
        resetSearch: () => {
            state.events.ui.filterText = '';
            state.events.ui.filterItems = [];
            listeners.forEach(fn => fn(state));
        },
        saveUsers: async (id, values) => {
            state.users.ui.editErrors = validateEditUsersTable(values);

            const isValid = Object.values(state.users.ui.editErrors).every(v => v === true);
            console.log("isValid:", isValid)

            if(!isValid){
                listeners.forEach(fn => fn(state));
                runAnimationAlert(store, "Неправильний формат данних в виділених колонках, збереження не можливе!");
                return;
            }
            const payload ={
                name: values.name,
                email: values.email
            };
            store.setState({users: { ...state.users, isLoading: true, screenError: null }});
            try {
                const res = await updateUserPatch(id, payload);
                if (!res.ok){
                    const err = res.error ?? {};


                    const message = err?.details?.error?.message
                        || err?.message
                        || 'Помилка збереження';

                    const isConflict = err.status === 409
                        || err.code === 'CONFLICT'
                        || err.kind === 'conflict';

                    const nextEditErrors = { ...state.users.ui.editErrors };
                    if (isConflict) {
                        nextEditErrors.email = false;
                    }
                    state.users.ui.editErrors = nextEditErrors;
                    store.setState({ users: { ...state.users, screenError: err, isLoading: false } });

                    runAnimationAlert(store, message);
                    return;
                }
                await store.loadUsers();
            }catch (e){
                store.setState({users: { ...state.users, screenError: "Unexpected error", isLoading: false }});
                runAnimationAlert(store, "Unexpected error");
            }
            state.users.ui.editingId = null;
            state.users.ui.editValues = null;
            state.users.ui.editErrors = structuredClone(initialState.users.ui.editErrors);

            listeners.forEach(fn => fn(state));
            runAnimationAlert(store, "Успішно збережено!✅")

        },
        saveEvents: async (id, values) => {

            state.events.ui.editErrors = validateEditEventsTable(values);

            const isValid = Object.values(state.events.ui.editErrors).every(v => v === true);
            console.log("isValid:", isValid)

            if (!isValid) {
                listeners.forEach(fn => fn(state));
                runAnimationAlert(store, "Неправильний формат данних в виділених колонках, збереження не можливе!");
                return;
            }

            const payload = {
                name: values.name.trim() ,
                date: values.date,
                location: values.location.trim() ,
                capacity: Number(values.capacity),
                description: values.description?.trim() || "-"
            };

            if (!payload.date || !Number.isFinite(payload.capacity)) {
                listeners.forEach(fn => fn(state));
                return;
            }

            store.setState({
                events: { ...state.events, isLoading: true, screenError: null }
            });

            try {
                const res = await updateEventsPatch(id, payload);

                if (!res.ok) {
                    const err = res.error ?? {};


                    const message = err?.details?.error?.message
                        || err?.message
                        || 'Помилка збереження';

                    const isConflict = err.status === 409
                        || err.code === 'CONFLICT'
                        || err.kind === 'conflict';

                    const nextEditErrors = { ...state.events.ui.editErrors };
                    if (isConflict) {
                        nextEditErrors.name = false;
                    }
                    state.events.ui.editErrors = nextEditErrors;
                    store.setState({ events: { ...state.events, screenError: err, isLoading: false } });

                    runAnimationAlert(store, message);
                    return;
                }

                await store.loadEvents();

            } catch (e) {
                store.setState({
                    events: { ...state.events, screenError: "Unexpected error", isLoading: false }
                });
            }
            state.events.ui.editingId = null;
            state.events.ui.editValues = null;
            state.events.ui.editErrors = structuredClone(initialState.events.ui.editErrors);

            listeners.forEach(fn => fn(state));
            runAnimationAlert(store, "Успішно збережено!✅");
        },
        editUsers: (id) => {
            state.users.ui.editingId = id;
            const item = state.users.list.find(e => e.id === id);
            state.users.ui.editValues = {
                name: item.name,
                email: item.email,
                password: item.password,
            };
            listeners.forEach(fn => fn(state));
        },
        editEvents: (id) => {
            state.events.ui.editingId = id;
            const item = state.events.list.find(e => e.id === id);
            state.events.ui.editValues = {
                name: item.name,
                date: new Date(item.date).toLocaleDateString("uk-UA"),
                location: item.location,
                capacity: String(item.capacity),
                description: item.description ?? "-",
            };
            listeners.forEach(fn => fn(state));
        },
        setFilterTextUsers: (text) => {
          state.users.ui.filterText = text;
          state.users.ui.filterItems = state.users.list.filter(item => item.name.toLowerCase().includes(text.toLowerCase()));
          listeners.forEach(fn => fn(state));
        },
        setFilterTextEvents: (text) => {
            state.events.ui.filterText = text;
            state.events.ui.filterItems = state.events.list.filter(item => item.name.toLowerCase().includes(text.toLowerCase()));
            listeners.forEach(fn => fn(state));
        },
        setSorterUsers: (sort) => {
          state.users.ui.sorter = sort;
          if(state.users.ui.sorter === "number_sorter"){
              state.users.list.sort((a, b) => b.id - a.id);
          }
          else if(state.users.ui.sorter === "name_sorter"){
              state.users.list.sort((a,b)=> a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
          }
          else if(state.users.ui.sorter === "email_sorter") {
              state.users.list.sort((a, b) => a.email.toLowerCase().localeCompare(b.email.toLowerCase()));
          }
        },
        setSorterEvents: (sort) => {
            state.events.ui.sorter = sort;
            if(state.events.ui.sorter === "number_sorter"){
                state.events.list.sort((a, b) => b.id - a.id);
            }
            else if(state.events.ui.sorter === "date_sorter"){
                state.events.list.sort(
                    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
                );
            }
            else if(state.events.ui.sorter === "name_sorter"){
                state.events.list.sort((a,b)=> a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
            }
            else if(state.events.ui.sorter === "capacity_sorter") {
                state.events.list.sort((a, b) => a.capacity - b.capacity);
            }
            listeners.forEach(fn => fn(state));
        },
        updateFieldUsers: (name, value) => {
          state.users.form.touched[name] = true;
          state.users.form.values[name] = value;
          state.users.form.errors = validateUsersForm(state.users.form);
          state.users.form.isValid = Object.keys(state.users.form.errors).length === 0;
          listeners.forEach(fn => fn(state));
        },
        updateFieldLogin: (name, value) => {
            state.login.form.touched[name] = true;
            state.login.form.values[name] = value;
            state.login.form.errors = validateLoginForm(state.login.form);
            state.login.form.isValid = Object.keys(state.login.form.errors).length === 0;
            listeners.forEach(fn => fn(state));
        },
        updateFieldRegistration: (name, value) => {
            state.registration.form.touched[name] = true;
            state.registration.form.values[name] = value;
            state.registration.form.errors = validateRegistrationForm(state.registration.form);
            state.registration.form.isValid = Object.keys(state.registration.form.errors).length === 0;
            listeners.forEach(fn => fn(state));
        },
        updateFieldEvents: (name, value) => {
            state.events.form.touched[name] = true;
            state.events.form.values[name] = value;
            state.events.form.errors = validateEventsForm(state.events.form);
            state.events.form.isValid = Object.keys(state.events.form.errors).length === 0;
            listeners.forEach(fn => fn(state));
        },
        submitFormUsers: async () => {
          state.users.form.touched = {
              name: true, email: true, password: true
          };
          const errors = validateUsersForm(state.users.form);
          state.users.form.errors = errors;
          state.users.form.isValid = Object.keys(errors).length === 0;

          if (!state.users.form.isValid) {
               listeners.forEach(fn => fn(state));
               return;
           }
           console.log(state.users.form.values)
           const toAdd = {
               name: state.users.form.values.name,
               email: state.users.form.values.email,
               password: state.users.form.values.password,
           };
          const res = await addUsers(toAdd).catch(e => console.error("Error adding user:", e));
          if(!res){
              listeners.forEach(fn => fn(state));
              runAnimationAlert(store, "Не вдалось додати!")
              return;
          }
          state.users.form = structuredClone(initialState.users.form);
          state.users.ui.filterItems = state.users.list.filter(item => item.name.toLowerCase().includes(state.users.ui.filterText.toLowerCase()));
          listeners.forEach(fn => fn(state));
          runAnimationAlert(store, "Запис успішно створений✅!")
        },
        submitFormLogin: async () => {
            state.login.form.touched = {
                email: true, password: true
            };
            const errors = validateLoginForm(state.login.form);
            state.login.form.errors = errors;
            state.login.form.isValid = Object.keys(errors).length === 0;

            if (!state.login.form.isValid) {
                listeners.forEach(fn => fn(state));
                return;
            }
            const toAdd = {
                email: state.login.form.values.email,
                password: state.login.form.values.password,
            };
            const res = await Login(toAdd);
            console.log(res)
            if(!res.ok){
                state.login.form.generalError = res.error.details.error.message;
                listeners.forEach(fn => fn(state));
                runAnimationAlert(store, res.error.details.error.message || "Помилка регістрації")
                return;
            }

            state.auth = {
                ...state.auth,
                name: res.data.name
            };
            state.login.form = structuredClone(initialState.login.form);
            listeners.forEach(fn => fn(state));
            runAnimationAlert(store, `Вітаємо, ${res.data.user.name? res.data.user.name : `користувачу`}!`)
            const params = new URLSearchParams(window.location.search);
            const redirectPage = params.get('redirect') || '/pages/events.html';
            if (redirectPage.includes('login') || redirectPage.includes('register') || redirectPage.includes('logout')
                || redirectPage.includes('users')) {
                window.location.href ='/pages/events.html';
                return;
            }
            window.location.href = redirectPage;
        },
        submitFormRegistration: async () => {
            state.registration.form.touched = {
                name: true, email: true, password: true
            };
            const errors = validateRegistrationForm(state.login.form);
            state.registration.form.errors = errors;
            state.registration.form.isValid = Object.keys(errors).length === 0;

            if (!state.registration.form.isValid) {
                listeners.forEach(fn => fn(state));
                return;
            }
            const toRegister = {
                name: state.registration.form.values.name,
                email: state.registration.form.values.email,
                password: state.registration.form.values.password,
            };

            const res = await Register(toRegister);
            if(!res.ok){
                state.registration.form.generalError = res.error.details.error.message;
                listeners.forEach(fn => fn(state));
                runAnimationAlert(store, res.error.details.error.message || "Помилка реєстрації")
                return;
            }
            const toAdd = {
                email: state.registration.form.values.email,
                password: state.registration.form.values.password,
            };
            const loginRes = await Login(toAdd);
            if(!loginRes.ok){
                const errMsg = loginRes.error?.details?.error?.message || "Помилка авторизації після реєстрації";
                state.registration.form.generalError = errMsg;
                listeners.forEach(fn => fn(state));
                runAnimationAlert(store, errMsg);
                return;
            }
            state.auth = {
                ...state.auth,
                name: res.data.name
            };
            state.login.form = structuredClone(initialState.login.form);
            listeners.forEach(fn => fn(state));
            runAnimationAlert(store, `Вітаємо, ${res.data.user.name? res.data.user.name : `користувачу`}!`)
            const params = new URLSearchParams(window.location.search);
            const redirectPage = params.get('redirect') || '/pages/events.html';
            if (redirectPage.includes('login') || redirectPage.includes('register') || redirectPage.includes('logout')
                || redirectPage.includes('users')) {
                window.location.href ='/pages/events.html';
                return;
            }
            window.location.href = redirectPage;
        },
        submitFormEvents: async () => {
            state.events.form.touched = {
                name: true, date: true, location: true, capacity: true, description: true
            };
            const errors = validateEventsForm(state.events.form);
            state.events.form.errors = errors;
            state.events.form.isValid = Object.keys(errors).length === 0;

            if (!state.events.form.isValid) {
                listeners.forEach(fn => fn(state));
                return;
            }
            console.log(state.events.form.values)
            const toAdd = {
                ...state.events.form.values,
                capacity: Number(state.events.form.values.capacity),
                description: state.events.form.values.description?.trim() || "-",
            };
            const success =  await addEvents(toAdd).catch(e => console.error("Error adding event:", e));
            if (!success) return;
            state.events.form = structuredClone(initialState.events.form);
            state.events.ui.filterItems = state.events.list.filter(item => item.name.toLowerCase().includes(state.events.ui.filterText.toLowerCase()));
            listeners.forEach(fn => fn(state));
            runAnimationAlert(store, "Запис успішно створений✅!")
            },
        logout:  async () => {
          const res = await Logout();
          if(!res.ok){
              runAnimationAlert(store, res.error.details?.message || res.error.message)
              return;
          }
          state.login.form = structuredClone(initialState.login.form);
          state.login.form.generalError = null;
          store.setState({ auth: { ...state.auth, user: null }, login:
                  { ...state.login, form: structuredClone(initialState.login.form) }
          });
          listeners.forEach(fn => fn(state));
          window.location.replace('/pages/events.html');
        },
        resetFormUsers: () => {
            state.users.form.touched = {}
            state.users.form.values = structuredClone(initialState.users.form.values);
            state.users.form.errors = structuredClone(initialState.users.form.errors);
            state.users.form.isValid = true;
            listeners.forEach(fn => fn(state));
        },
        resetFormLogin: () => {
            state.login.form.touched = {};
            state.login.form.values = structuredClone(initialState.login.form.values);
            state.login.form.errors = structuredClone(initialState.login.form.errors);
            state.login.form.isValid = true;
            listeners.forEach(fn => fn(state));
        },
        resetFormRegistration: () => {
            state.registration.form.touched = {};
            state.registration.form.values = structuredClone(initialState.registration.form.values);
            state.registration.form.errors = structuredClone(initialState.registration.form.errors);
            state.registration.form.isValid = true;
            listeners.forEach(fn => fn(state));
        },
        resetFormEvents: () => {
            state.events.form.touched = {}
            state.events.form.values = structuredClone(initialState.events.form.values);
            state.events.form.errors = structuredClone(initialState.events.form.errors);
            state.events.form.isValid = true;
            listeners.forEach(fn => fn(state));
        },
        subscribe: (fn) => {
            listeners.push(fn);
        }
    }
    return store;
}

