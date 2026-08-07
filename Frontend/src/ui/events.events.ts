import { toYMD } from "../utils/utils.js";
import {createStore} from "../state/store.js";

export function bindEventsEvents(store: ReturnType<typeof createStore>) {
  const searchContainer = document.querySelector(".search_for_element") as HTMLElement;
  searchContainer.addEventListener("click", function (event: MouseEvent) {
    const target = event.target as HTMLElement;
    const input = document.querySelector("#input_for_search") as HTMLInputElement;

    if ((target as HTMLElement).id === "button_for_search") {
      store.setFilterTextEvents(input.value.trim());
    }

    if ((target as HTMLElement).id === "button_for_reset") {
      store.resetSearch();
      input.value = "";
    }
  });
  const input = document.querySelectorAll("#register-form input, #register-form textarea");
  input.forEach((el) => {
    el.addEventListener("input", (event: Event) => {
      const target = event.target as HTMLInputElement | HTMLTextAreaElement;
      let value = target.value.trim();
      if (target.name === "description" && value === "") {
        value = "-";
      }
      console.log("finalValue:", value);
      if (target.name === "date") {
        store.updateFieldEvents(target.name, value);
        return;
      }
      store.updateFieldEvents(target.name, value);
    });
  });
  const tbody = document.querySelector(".register_table_body") as HTMLElement;

    tbody.addEventListener("click", async (event: MouseEvent) => {
      console.log("CLICK IN TBODY");
    const target = event.target as HTMLElement;

    if (target.classList.contains("delete-btn")) {
      store.deleteEvents(Number((target as HTMLElement).dataset.id));
      return;
    }

    if (target.classList.contains("edit-btn")) {
      store.editEvents(Number((target as HTMLElement).dataset.id));
      return;
    }

    if (target.classList.contains("save-btn")) {

    const id = Number((target as HTMLElement).dataset.id);
    const editValues = store.getState().events.ui.editValues;
    if (!editValues) return;

    let YMD = toYMD(editValues.date);
    if (!YMD) YMD = "";
    const payload = {
        ...editValues,
        date: YMD,
    };

    await store.saveEvents(id, payload);

    }
    if (target.classList.contains("registration-btn")){
        const regBtn = target as HTMLButtonElement
        const eventId = regBtn.dataset.id as string;
        if (!eventId) return;
        regBtn.disabled = true;
        const orig = regBtn.textContent || '';
        regBtn.textContent = "Опрацювання..."
        const ok = await store.addRegistration(eventId);
        if (!ok) { regBtn.disabled = false; regBtn.textContent = orig; }
        return;
    }
  });
  tbody.addEventListener("input", (event: Event) => {
    const cell = event.target as HTMLElement;
    const row = cell.closest("tr") as HTMLTableRowElement | null;
    if (!row) return;

    const s = store.getState();
    const id = Number((row as HTMLTableRowElement).dataset.id);

    if (s.events.ui.editingId !== id) return;

    const cells = (row as HTMLTableRowElement).children;

    s.events.ui.editValues = {
      name: (cells[1].textContent || "").trim(),
      date: (cells[2].textContent || "").trim(),
      location: (cells[3].textContent || "").trim(),
      capacity: (cells[4].textContent || "").trim(),
      description: (cells[5].textContent || "").trim(),
    };
  });
  const spinner = document.querySelector(".spinner") as HTMLElement;
  const wrapper = document.querySelector(".spinner-wrapper") as HTMLElement;
  store.subscribe((state: any) => {
    if (state.events.isLoading || state.auth.isLoading) {
      spinner.classList.remove("hidden");
      wrapper.classList.remove("hidden");
      (wrapper as HTMLElement).style.pointerEvents = 'auto';
    } else {
      spinner.classList.add("hidden");
      wrapper.classList.add("hidden");
      (wrapper as HTMLElement).style.pointerEvents = 'none';
    }
  });

  const select = document.querySelector("#table_sorter") as HTMLSelectElement;
  select.addEventListener("change", (event: Event) => {
    const target = event.target as HTMLSelectElement;
    store.setSorterEvents(target.value);
  });

  (document.querySelector("header") as HTMLElement).addEventListener("click", async (e: MouseEvent) => {
    const t = e.target as HTMLElement;
    if (t.id === "logout") await store.logout();
  });
  const btn = document.querySelector(".register-form_button_reset") as HTMLElement;
  btn.addEventListener("click", () => {
    const form = document.getElementById('register-form') as HTMLFormElement | null;
    if (form) form.reset();
    store.resetFormEvents();
  });
  const form = document.getElementById("register-form") as HTMLFormElement;
  form.addEventListener("submit", function (event: Event) {
    console.log("submit спрацював");
    event.preventDefault();
    store.submitFormEvents();
    const f = document.getElementById('register-form') as HTMLFormElement;
    if (store.getState().events.form.isValid) {
      f.reset();
    }
  });
}
