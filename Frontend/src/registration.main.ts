import { createStore } from "./state/store.js";
import { bindEventsRegistration } from "./ui/registration.events.js";
import { renderRegistrationApp } from "./ui/registration.render.js";

const store = createStore();

store.subscribe((state) => {
  if (state.auth.isLoading) return;
  renderRegistrationApp(state as any);
});

const res = await store.checkAuth();
console.log("checkAuth result", res);
console.log("auth state", store.getState().auth);

if ((res as any).ok) {
  window.location.replace('/pages/events.html');
}

bindEventsRegistration(store as any);
