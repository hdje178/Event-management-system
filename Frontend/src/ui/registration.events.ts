import {createStore} from "../state/store";

export function bindEventsRegistration(store: ReturnType<typeof createStore>) {
  const input = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
    "#register-form input, #register-form textarea",
  );
  input.forEach((el) => {
    el.addEventListener("input", (event: Event) => {
      const target = event.target as HTMLInputElement | HTMLTextAreaElement;
      const value = target.value.trim();
      store.updateFieldRegistration(target.name, value);
    });
  });

  const spinner = document.querySelector(".spinner") as HTMLElement;
  const wrapper = document.querySelector(".spinner-wrapper") as HTMLElement;

  store.subscribe((state: any) => {
    if (state.auth.isLoading) {
      spinner.classList.remove("hidden");
      wrapper.classList.remove("hidden");
      (wrapper as HTMLElement).style.pointerEvents = 'auto';
    } else {
      spinner.classList.add("hidden");
      wrapper.classList.add("hidden");
      (wrapper as HTMLElement).style.pointerEvents = 'none';
    }
  });

  const btn = document.querySelector(".register-form_button_reset") as HTMLElement;
  btn.addEventListener("click", () => {
    const form = document.getElementById('register-form') as HTMLFormElement | null;
    if (form) form.reset();
    store.resetFormRegistration();
  });

  const form = document.getElementById("register-form") as HTMLFormElement;
  form.addEventListener("submit", async function (event: Event) {
    console.log("submit спрацював");
    event.preventDefault();
    await store.submitFormRegistration();
    const f = document.getElementById('register-form') as HTMLFormElement;
    if (store.getState().userRegistrations.form.isValid) {
      f.reset();
    }
  });
}
