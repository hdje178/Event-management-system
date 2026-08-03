import type { AppState } from "../state/initialState.js";

function renderEventsApp(state: AppState) {
  renderEventsTable(state);
  renderEventsTableErrors(state.events as any);
  renderEventsFormErrors(state.events as any);
  renderEventsForm(state);
  renderHeader(state);
  renderWelcome(state);
  renderEventsThead(state);
  console.log("renderEventsApp");
}
let lastAuthUser: unknown = undefined;

export { renderEventsApp };

function escapeHtml(str: unknown) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderEventsTable(state: AppState) {
  const tbody = document.querySelector(".register_table_body") as HTMLElement;
  tbody.innerHTML = "";

  const events = state.events.ui.filterText ? state.events.ui.filterItems : state.events.list;
  console.log(events);

  const rowHtml = events
    .map((item, index) => {
      const isEditing = state.events.ui.editingId === item.id;
      const v = isEditing && state.events.ui.editValues ? state.events.ui.editValues : null as any;

      const nameVal = isEditing ? (v as any).name : item.name;
      const locationVal = isEditing ? (v as any).location : item.location;
      const capacityVal = isEditing ? (v as any).capacity : item.capacity;
      const descriptionVal = isEditing ? (v as any).description : item.description;

      const dateVal = isEditing ? (v as any).date : new Date(item.date).toLocaleDateString("uk-UA");

      if (state.auth.user) {
        if (state.auth.user.role.toLowerCase() === "admin") {
          return `
      <tr data-id="${item.id}">
        <td data-id="${item.id}">${index + 1}</td>
        <td data-id="${item.id}" ${isEditing ? 'contenteditable="true"' : ""}>${escapeHtml(nameVal)}</td>
        <td data-id="${item.id}" ${isEditing ? 'contenteditable="true"' : ""}>${escapeHtml(dateVal)}</td>
        <td data-id="${item.id}" ${isEditing ? 'contenteditable="true"' : ""}>${escapeHtml(locationVal)}</td>
        <td data-id="${item.id}" ${isEditing ? 'contenteditable="true"' : ""}>${escapeHtml(capacityVal)}</td>
        <td data-id="${item.id}" width="15%" ${isEditing ? 'contenteditable="true"' : ""}>${escapeHtml(descriptionVal)}</td>
        <td data-id="${item.id}"><button type="button" class="delete-btn" data-id="${item.id}">Видалити</button></td>
        <td data-id="${item.id}"><button type="button" ${isEditing ? 'class="save-btn"' : 'class="edit-btn"'} data-id="${item.id}">${
            isEditing ? "Зберегти" : "Редагувати"
          }</button></td>
      </tr>`;
        } else {
          const isRegistered = state.registration.list.some((r) => (r as any).eventId === item.id);
          return `
      <tr data-id="${item.id}">
        <td data-id="${item.id}">${index + 1}</td>
        <td data-id="${item.id}" ${isEditing ? 'contenteditable="true"' : ""}>${escapeHtml(nameVal)}</td>
        <td data-id="${item.id}" ${isEditing ? 'contenteditable="true"' : ""}>${escapeHtml(dateVal)}</td>
        <td data-id="${item.id}" ${isEditing ? 'contenteditable="true"' : ""}>${escapeHtml(locationVal)}</td>
        <td data-id="${item.id}" ${isEditing ? 'contenteditable="true"' : ""}>${escapeHtml(capacityVal)}</td>
        <td data-id="${item.id}" width="15%" ${isEditing ? 'contenteditable="true"' : ""}>${escapeHtml(descriptionVal)}</td>
        <td data-id="${item.id}"><button type="button" class="registration-btn" data-id="${item.id}" ${
            isRegistered ? "disabled" : ""
          }>${isRegistered ? "Вже зареєстровані" : "Зареєструватись"}</button></td>
      </tr>`;
        }
      } else {
        return `
      <tr data-id="${item.id}">
        <td data-id="${item.id}">${index + 1}</td>
        <td data-id="${item.id}" ${isEditing ? 'contenteditable="true"' : ""}>${escapeHtml(nameVal)}</td>
        <td data-id="${item.id}" ${isEditing ? 'contenteditable="true"' : ""}>${escapeHtml(dateVal)}</td>
        <td data-id="${item.id}" ${isEditing ? 'contenteditable="true"' : ""}>${escapeHtml(locationVal)}</td>
        <td data-id="${item.id}" ${isEditing ? 'contenteditable="true"' : ""}>${escapeHtml(capacityVal)}</td>
        <td data-id="${item.id}" width="15%" ${isEditing ? 'contenteditable="true"' : ""}>${escapeHtml(descriptionVal)}</td>
      </tr>`;
      }
    })
    .join("");

  tbody.innerHTML = rowHtml;
}
export function renderHeader(state: AppState) {
  if (lastAuthUser === state.auth.user) {
    return;
  }
  lastAuthUser = state.auth.user as any;
  const header = document.querySelector("header") as HTMLElement;
  if (state.auth.user) {
    if (state.auth.user.role.toLowerCase() === "admin") {
      header.innerHTML = `        <span class="logo">
            <a href="events.html"><img alt="FIT logo" src="../icons/FIT_icon.png">&nbsp;& JunkoTeam</a></span>
        <nav class="navbar_header">
            <ul>
                <li><a href="events.html">Events</a></li>
                <li><a href="users.html">Users</a></li>
                <li><a href="myRegistrations.html">My Registrations</a></li>
                <li><a id="logout">Logout</a></li>
            </ul>
        </nav>`;
    } else {
      header.innerHTML = `        <span class="logo">
            <a href="events.html"><img alt="FIT logo" src="../icons/FIT_icon.png">&nbsp;& JunkoTeam</a></span>
        <nav class="navbar_header">
            <ul>
                <li><a href="events.html">Events</a></li>
                <li><a href="myRegistrations.html">My Registrations</a></li>
                <li><a id="logout">Logout</a></li>
            </ul>
        </nav>`;
    }
  } else {
    header.innerHTML = `      <span class="logo">
            <a href="events.html"><img alt="FIT logo" src="../icons/FIT_icon.png">&nbsp;& JunkoTeam</a></span>
        <nav class="navbar_header">
            <ul>
                <li><a href="login.html?redirect=${encodeURIComponent(window.location.pathname)}">Login</a></li>
                <li><a href="registration.html">Registration</a></li>
            </ul>
        </nav>`;
  }
  requestAnimationFrame(() => {
    (header.querySelector("nav") as HTMLElement).classList.add("visible");
  });
}
export function renderWelcome(state: AppState) {
  const h1 = document.querySelector("#header_h1") as HTMLElement;
  let welcome = document.querySelector("#welcome_msg") as HTMLElement | null;

  if (state.auth.user) {
    if (!welcome) {
      welcome = document.createElement("p");
      welcome.id = "welcome_msg";
      h1.insertAdjacentElement("afterend", welcome);
      welcome.style.textAlign = "center";
      welcome.style.marginBottom = "20px";
      welcome.style.fontSize = "1.2em";
    }
    (welcome as HTMLElement).textContent = `Вітаємо, ${state.auth.userInfo?.name || "користувачу"}!`;
  } else {
    if (welcome) welcome.remove();
  }
}
function renderEventsThead(state: AppState) {
  const thead = document.querySelector(".register_table_head") as HTMLElement;
  if (state.auth.user) {
    if (state.auth.user.role.toLowerCase() === "admin") {
      thead.innerHTML = `           <tr>
                        <th>Номер</th>
                        <th>Назва</th>
                        <th>Дата</th>
                        <th>Локація</th>
                        <th>К-сть чоловік</th>
                        <th>Опис</th>
                        <th>Видалити</th>
                        <th>Редагувати/Зберегти</th>
                    </tr>`;
    } else {
      thead.innerHTML = ` <tr>
                        <th>Номер</th>
                        <th>Назва</th>
                        <th>Дата</th>
                        <th>Локація</th>
                        <th>К-сть чоловік</th>
                        <th>Опис</th>
                        <th>Реєстрація</th>
                        </tr>    `;
    }
  } else {
    thead.innerHTML = ` <tr>
                        <th>Номер</th>
                        <th>Назва</th>
                        <th>Дата</th>
                        <th>Локація</th>
                        <th>К-сть чоловік</th>
                        <th>Опис</th>
                        </tr>    `;
  }
}

function renderEventsForm(state: AppState) {
  const form = document.querySelector(".form_container") as HTMLElement;
  const table = document.querySelector(".table_container") as HTMLElement;
  if (state.auth.user) {
    if (state.auth.user.role.toLowerCase() === "admin") {
      form.classList.remove("hidden");

      if (Object.keys(state.events.form.touched).length === 0) {
        const fields = ["name", "date", "location", "capacity", "description"] as const;
        fields.forEach((field) => {
          const input = document.getElementById(`register-form_${field}`) as HTMLInputElement | HTMLTextAreaElement | null;
          if (input) (input as HTMLInputElement | HTMLTextAreaElement).value = "" as any;
        });
      }
    } else {
      form.classList.add("hidden");
    }
  } else {
    form.classList.add("hidden");
  }
}

function renderEventsFormErrors(state: AppState["events"]) {
  const fields = ["name", "date", "location", "capacity"] as const;
  const submit_btn = document.querySelector(".register-form_button_submit button") as HTMLButtonElement;
  fields.forEach((field) => {
    const el = document.getElementById(`${field}_error`) as HTMLElement;
    const input = document.getElementById(`register-form_${field}`) as HTMLInputElement | HTMLTextAreaElement;
    const message = (state.form.touched as any)[`${field}`] ? ((state.form.errors as any)[field] ?? "") : "";
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
function renderEventsTableErrors(state: AppState["events"]["ui"]) {
  if (!state.editErrors) return;
  if (!state.editingId) return;
  const fields = ["name", "date", "location", "capacity", "description"] as const;
  const cellsEditing = document.querySelectorAll(
    `td[data-id="${state.editingId}"][contenteditable="true"]`,
  ) as NodeListOf<HTMLElement>;
  if (!cellsEditing.length) return;
  fields.forEach((field, index) => {
    const el = cellsEditing[index];
    if ((state.editErrors as any)[field] === false) {
      el.classList.add("error-cell");
    } else {
      el.classList.remove("error-cell");
    }
  });
}
