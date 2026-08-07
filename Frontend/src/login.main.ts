import { createStore } from "./state/store.js";
import { bindEventsLogin } from "./ui/login.events.js";
import { renderLoginApp } from "./ui/login.render.js";

const store = createStore();
store.subscribe((state) => {
  if (state.auth.isLoading) return;
  renderLoginApp(state);
});

const res = await store.checkAuth();
console.log("checkAuth result", res);
console.log("auth state", store.getState().auth.user);
if (res?.ok){
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect");

    const target =
        redirect && redirect.startsWith("/")
            ? redirect
            : "/pages/events.html";

    window.location.replace(target);
}

bindEventsLogin(store);
