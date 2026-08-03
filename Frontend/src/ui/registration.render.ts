import type { AppState } from "../state/initialState.js";

export function renderRegistrationApp(state: AppState) {
  renderRegistrationFormErrors(state);
}

function renderRegistrationFormErrors(state: AppState) {
  const fields = ["name", "email", "password"] as const;
  const submit_btn = document.querySelector(
    ".register-form_button_submit button",
  ) as HTMLButtonElement;
  fields.forEach((field) => {
    const el = document.getElementById(`${field}_error`) as HTMLElement;
    const input = document.getElementById(`register-form_${field}`) as HTMLInputElement;
    const message = (state.userRegistrations.form.touched as any)[`${field}`]
      ? ((state.userRegistrations.form.errors as any)[field] ?? "")
      : "";
    el.textContent = message;
    message ? input.classList.add("invalid") : input.classList.remove("invalid");
    if (message) {
      el.classList.add("visible");
    } else {
      el.classList.remove("visible");
    }
  });
  submit_btn.disabled = !state.userRegistrations.form.isValid;
  const generalError = document.getElementById("general_error") as HTMLElement | null;
  if (generalError) {
    generalError.textContent = (state.userRegistrations.form as any).generalError ?? "";
  }
}
