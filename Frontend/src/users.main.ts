import { createStore } from "./state/store.js";
import { saveToLocalStorage } from "./utils/storage.js";
import { bindEventsUsers } from "./ui/users.events.js";
import { renderUsersApp } from "./ui/users.render.js";

const store = createStore();
let isAuthReady = false;

store.subscribe((state) => saveToLocalStorage(state as any));
store.subscribe((state) => {
  const scrollY = window.scrollY;
  if (state.auth.isLoading) return;
  if (!isAuthReady) return;
  renderUsersApp(state as any);
  window.scrollTo(0, scrollY);
});

const res = await store.checkAuth();
const user = store.getState().auth.user as any;
console.log("CheckAuth", res);
console.log("auth", store.getState().auth.user);
if (user.role.toLowerCase() !== "admin") {
  document.body.classList.add("not-ready");
  window.location.replace('/pages/login.html?redirect=/pages/events.html');
}

isAuthReady = true;
document.body.classList.remove("not-ready");
bindEventsUsers(store as any);
store.loadUsers();
