import { createStore } from "./state/store.js";
import { bindEventsLogin } from "./ui/login.events.js";
import { renderLoginApp } from "./ui/login.render.js";

const store = createStore();
store.subscribe((state) => {
  if (state.auth.isLoading) return;
  renderLoginApp(state as any);
});

const res = await store.checkAuth();
console.log("checkAuth result", res);
console.log("auth state", store.getState().auth);
if ((res as any).ok) {
  window.location.replace('/pages/events.html');
}

bindEventsLogin(store as any);
