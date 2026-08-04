import type { AppState } from "../state/initialState.js";

function renderUsersApp(state: AppState) {
  renderUsersTable(state.users);
  renderUsersTableErrors(state.users.ui);
  renderUsersFormErrors(state.users);
  renderUsersForm(state.users);
  console.log("renderEventsApp");
}

export { renderUsersApp };

function escapeHtml(str: unknown) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderUsersTable(state: AppState["users"]) {
  const tbody = document.querySelector(".register_table_body") as HTMLElement;
  tbody.innerHTML = "";
  const events = state.ui.filterText ? state.ui.filterItems : state.list;
  console.log(events);
  const rowHtml = events
    .map((item, index) => {
      const isEditing = state.ui.editingId === item.id;
      const v = state.ui.editValues;
      return `
      <tr data-id="${item.id}">
        <td data-id="${item.id}">${index + 1}</td>
        <td data-id="${item.id}" ${isEditing ? 'contenteditable="true"' : ""}>${escapeHtml(isEditing && v ? v.name : item.name)}</td>
        <td data-id="${item.id}" ${isEditing ? 'contenteditable="true"' : ""}>${escapeHtml(isEditing && v ? v.email : item.email)}</td>
        <td data-id="${item.id}">${escapeHtml(item.role)}</td>
        <td data-id="${item.id}"><button type="button" class="delete-btn" data-id="${item.id}">Видалити</button></td>
        <td data-id="${item.id}"><button type="button" ${isEditing ? 'class="save-btn"' : 'class="edit-btn"'} data-id="${item.id}">${
          isEditing ? "Зберегти" : "Редагувати"
        }</button></td>
      </tr>`;
    })
    .join("");
  tbody.innerHTML = rowHtml;
}

function renderUsersForm(state: AppState["users"]) {
  if (Object.keys(state.form.touched).length === 0) {
    const fields = ["name", "email", "password"] as const;
    fields.forEach((field) => {
      const input = document.getElementById(`register-form_${field}`) as HTMLInputElement | null;
      if (input) input.value = "";
    });
  }
  const header = document.querySelector("header") as HTMLElement;
  requestAnimationFrame(() => {
    (header.querySelector("nav") as HTMLElement).classList.add("visible");
  });
}

function renderUsersFormErrors(state: AppState["users"]) {
  const fields = ["name", "email", "password"] as const;
  const submit_btn = document.querySelector(".register-form_button_submit button") as HTMLButtonElement;
  fields.forEach((field) => {
    const el = document.getElementById(`${field}_error`) as HTMLElement;
    const input = document.getElementById(`register-form_${field}`) as HTMLInputElement;
    const message = state.form.touched[field] ? (state.form.errors[field] ?? "") : "";
    el.textContent = message;
    message ? input.classList.add("invalid") : input.classList.remove("invalid");
    if (message) {
      el.classList.add("visible");
    } else {
      el.classList.remove("visible");
    }
  });
  submit_btn.disabled = !state.form.isValid;
}
function renderUsersTableErrors(state: AppState["users"]["ui"]) {
  if (!state.editErrors) return;
  if (!state.editingId) return;
  const fields = ["name", "email"] as const;
  const cellsEditing = document.querySelectorAll(
    `td[data-id="${state.editingId}"][contenteditable="true"]`,
  ) as NodeListOf<HTMLElement>;
  if (!cellsEditing.length) return;
  fields.forEach((field, index) => {
    const el = cellsEditing[index];
    if (state.editErrors[field] === false) {
      el.classList.add("error-cell");
    } else {
      el.classList.remove("error-cell");
    }
  });
}
