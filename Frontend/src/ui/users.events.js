import {toYMD} from "../utils/utils.js";

export function bindEventsUsers(store) {
    const searchContainer = document.querySelector(".search_for_element");
    function getDocumentScroller() {
        if (document.scrollingElement) return document.scrollingElement;
        return document.compatMode === 'CSS1Compat' ? document.documentElement : document.body;
    }
    const input = document.querySelectorAll("#register-form input, #register-form textarea");
    input.forEach(el => {
        el.addEventListener("input", (event) => {
            let value = event.target.value.trim();
            store.updateFieldUsers(event.target.name, value )
        })
    })
    const tbody = document.querySelector(".register_table_body");
    tbody.addEventListener("click", (event) => {
        const target = event.target;

        if (target.classList.contains("delete-btn")) {
            store.deleteUsers(Number(target.dataset.id));
            return;
        }

        if (target.classList.contains("edit-btn")) {
            store.editUsers(Number(target.dataset.id));
            return;
        }

        if (target.classList.contains("save-btn")) {
            const id = Number(target.dataset.id);
            const state = store.getState().users.ui.editValues;
            store.saveUsers(id, state);
        }
    });
    tbody.addEventListener("input", (event) => {
        const cell = event.target;
        const row = cell.closest("tr");
        if (!row) return;

        const state = store.getState();
        const id = Number(row.dataset.id);

        if (state.users.ui.editingId !== id) return;

        const cells = row.children;

        state.users.ui.editValues = {
            name: cells[1].textContent.trim(),
            email: cells[2].textContent.trim()
        };
    });
    const app = document.querySelector("main");
    const spinner = document.querySelector(".spinner");
    const wrapper = document.querySelector(".spinner-wrapper");
    store.subscribe((state) => {
        if (state.users.isLoading) {
            spinner.classList.remove("hidden");
            wrapper.classList.remove("hidden");
            wrapper.style.pointerEvents = 'auto';
        } else {
            spinner.classList.add("hidden");
            wrapper.classList.add("hidden");
            wrapper.style.pointerEvents = 'none'
        }
    });
    // const select = document.querySelector("#table_sorter");
    // select.addEventListener("change", (event) => {
    //     const target = event.target.value;
    //     store.setSorter(target);
    // })



    const btn = document.querySelector(".register-form_button_reset");
    btn.addEventListener("click", () => {
        const form = document.getElementById('register-form');
        if (form) form.reset();
        store.resetFormUsers()
    });
    const form = document.getElementById("register-form");
    form.addEventListener("submit", async function (event) {
        console.log("submit спрацював");
        event.preventDefault();
        await store.submitFormUsers();
        const form = document.getElementById('register-form');
        if (store.getState().users.form.isValid) {
            form.reset();
        }
    })
}
