import { createStore } from "./state/store.js";
import { saveToLocalStorage } from "./utils/storage.js";
import { bindEventsEvents } from "./ui/events.events.js";
import { renderEventsApp } from "./ui/events.render.js";

const store = createStore();
store.subscribe((state) => saveToLocalStorage(state));
store.subscribe((state) => {
  const scrollY = window.scrollY;
  if (state.auth.isLoading) return;
  renderEventsApp(state);
  window.scrollTo(0, scrollY);
});
const res = await store.checkAuth();
const user = store.getState().auth.user;
console.log("CheckAuth", res);
console.log("auth", store.getState().auth.user);

bindEventsEvents(store);
store.loadEvents();

if (user && user.role.toLowerCase() !== 'admin') {
  await store.loadMyRegistrations();
}
