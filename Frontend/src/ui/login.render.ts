import type { AppState } from "../state/initialState.js";

export function renderLoginApp(state: AppState) {
  renderLoginFormErrors(state);
}

function renderLoginFormErrors(state: AppState) {
  const fields = ["email", "password"] as const;
  const submit_btn = document.querySelector(
    ".register-form_button_submit button",
  ) as HTMLButtonElement;
  fields.forEach((field) => {
    const el = document.getElementById(`${field}_error`) as HTMLElement;
    const input = document.getElementById(`register-form_${field}`) as HTMLInputElement;
    const message = state.login.form.touched[field]
      ? (state.login.form.errors[field] ?? "")
      : "";
    el.textContent = message;
    message ? input.classList.add("invalid") : input.classList.remove("invalid");
    if (message) {
      el.classList.add("visible");
    } else {
      el.classList.remove("visible");
    }
  });
  submit_btn.disabled = !state.login.form.isValid;
  const generalError = document.getElementById("general_error") as HTMLElement | null;
  if (generalError) {
    generalError.textContent = state.login.form.generalError ?? "";
  }
}
