import {createStore} from "../state/store";
//
export function bindEventsUsers(store: ReturnType<typeof createStore>) {
  const searchContainer = document.querySelector(".search_for_element") as HTMLElement | null;
  function getDocumentScroller(): HTMLElement {
    if (document.scrollingElement) return document.scrollingElement as HTMLElement;
    return document.compatMode === 'CSS1Compat' ? (document.documentElement as HTMLElement) : (document.body as HTMLElement);
  }
  const input = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("#register-form input, #register-form textarea");
  input.forEach((el) => {
    el.addEventListener("input", (event: Event) => {
      const target = event.target as HTMLInputElement | HTMLTextAreaElement;
      const value = target.value.trim();
      store.updateFieldUsers(target.name, value);
    });
  });

  const tbody = document.querySelector(".register_table_body") as HTMLElement;
  tbody.addEventListener("click", (event: MouseEvent) => {
    const target = event.target as HTMLElement;

    if (target.classList.contains("delete-btn")) {
      store.deleteUsers(Number((target as HTMLElement).dataset.id));
      return;
    }

    if (target.classList.contains("edit-btn")) {
      store.editUsers(Number((target as HTMLElement).dataset.id));
      return;
    }

    if (target.classList.contains("save-btn")) {
      const id = Number((target as HTMLElement).dataset.id);
      const state = store.getState().users.ui.editValues as { name: string; email: string; password?: string };
      store.saveUsers(id, state);
    }
  });

  tbody.addEventListener("input", (event: Event) => {
    const cell = event.target as HTMLElement;
    const row = cell.closest("tr") as HTMLTableRowElement | null;
    if (!row) return;

    const state = store.getState();
    const id = Number((row as HTMLTableRowElement).dataset.id);

    if (state.users.ui.editingId !== id) return;

    const cells = (row as HTMLTableRowElement).children as HTMLCollectionOf<HTMLElement>;

    state.users.ui.editValues = {
      name: (cells[1].textContent || "").trim(),
      email: (cells[2].textContent || "").trim(),
    };
  });

  const spinner = document.querySelector(".spinner") as HTMLElement;
  const wrapper = document.querySelector(".spinner-wrapper") as HTMLElement;
  store.subscribe((state: any) => {
    if (state.users.isLoading) {
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
    store.resetFormUsers();
  });

  const form = document.getElementById("register-form") as HTMLFormElement;
  form.addEventListener("submit", async function (event: Event) {
    console.log("submit спрацював");
    event.preventDefault();
    await store.submitFormUsers();
    const f = document.getElementById('register-form') as HTMLFormElement;
    if (store.getState().users.form.isValid) {
      f.reset();
    }
  });
}
