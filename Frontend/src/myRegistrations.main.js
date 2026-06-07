import { createStore } from "./state/store.js";
import { saveToLocalStorage } from "./utils/storage.js";
import { bindMyRegistrationsEvents } from "./ui/myRegistration.events.js";
import { renderMyRegistrationsApp } from "./ui/myRegistrations.render.js";

const store = createStore();
let isAuthReady = false;

store.subscribe((state) => saveToLocalStorage(state));
store.subscribe((state) => {
    const scrollY = window.scrollY;
    if (state.auth.isLoading) return;
    if (!isAuthReady) return;
    renderMyRegistrationsApp(state);
    window.scrollTo(0, scrollY);
});

const res = await store.checkAuth();
const user = store.getState().auth.user;

if (!user) {
    document.body.classList.add("not-ready");
    window.location.replace('/pages/login.html?redirect=/pages/myRegistrations.html');
}

isAuthReady = true;
document.body.classList.remove("not-ready");
bindMyRegistrationsEvents(store);
const isAdmin = user.role.toLowerCase() === 'admin';
if (isAdmin){
    await store.loadUsers();
    await store.loadAllRegistrations()
}else{
    await store.loadMyRegistrations();
}
await store.loadEvents();

