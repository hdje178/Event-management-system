import {toYMD} from "../utils/utils.js";

export function bindEventsEvents(store) {
    const searchContainer = document.querySelector(".search_for_element");
    function getDocumentScroller() {
        if (document.scrollingElement) return document.scrollingElement;
        return document.compatMode === 'CSS1Compat' ? document.documentElement : document.body;
    }
    const scroller = getDocumentScroller();
    searchContainer.addEventListener("click", function (event) {
        const target = event.target;
        let input = document.querySelector("#input_for_search");

        if (target.id === "button_for_search") {
            store.setFilterTextEvents(input.value.trim());
        }

        if (target.id === "button_for_reset") {
            store.resetSearch();
            input.value = "";
        }
    });
    const input = document.querySelectorAll("#register-form input, #register-form textarea");
    input.forEach(el => {
        el.addEventListener("input", (event) => {
            let value = event.target.value.trim();
            if (event.target.name === "description" && value === ""){
                value = "-"
            }
            console.log("finalValue:", value);
            if (event.target.name === "date") {
                store.updateFieldEvents(
                    event.target.name,
                    value
                );
                return
            }
            store.updateFieldEvents(event.target.name, value )
        })
    })
    const tbody = document.querySelector(".register_table_body");
    tbody.addEventListener("click", async (event) => {
        const target = event.target;

        if (target.classList.contains("delete-btn")) {
            store.deleteEvents(Number(target.dataset.id));
            return;
        }

        if (target.classList.contains("edit-btn")) {
            store.editEvents(Number(target.dataset.id));
            return;
        }

        if (target.classList.contains("save-btn")) {
            const row = target.closest("tr");

            const id = Number(target.dataset.id);
            const state = store.getState().events.ui.editValues;
            let YMD = toYMD(state.date);
            if (!YMD) YMD = "";
            const payload = {
                ...state,
                date: YMD,
            };

            store.saveEvents(id, payload);
        }
        const regBtn = target.closest('.userRegistrations-btn');
        if (regBtn) {
            const eventId = regBtn.dataset.id;
            regBtn.disabled = true;
            const orig = regBtn.textContent;
            regBtn.textContent = 'Опрацювання...';
            const ok = await store.addRegistration(eventId);
            if (!ok) { regBtn.disabled = false; regBtn.textContent = orig; }
            return;
        }

    });
    tbody.addEventListener("input", (event) => {
        const cell = event.target;
        const row = cell.closest("tr");
        if (!row) return;

        const state = store.getState();
        const id = Number(row.dataset.id);

        if (state.events.ui.editingId !== id) return;

        const cells = row.children;

        state.events.ui.editValues = {
            name: cells[1].textContent.trim(),
            date: cells[2].textContent.trim(),
            location: cells[3].textContent.trim(),
            capacity: cells[4].textContent.trim(),
            description: cells[5].textContent.trim(),
        };
    });
    const app = document.querySelector("main");
    const spinner = document.querySelector(".spinner");
    const wrapper = document.querySelector(".spinner-wrapper");
    store.subscribe((state) => {
        if (state.events.isLoading || state.auth.isLoading) {
            spinner.classList.remove("hidden");
            wrapper.classList.remove("hidden");
            wrapper.style.pointerEvents = 'auto';
        } else {
            spinner.classList.add("hidden");
            wrapper.classList.add("hidden");
            wrapper.style.pointerEvents = 'none'
        }
    });

    const select = document.querySelector("#table_sorter");
    select.addEventListener("change", (event) => {
        const target = event.target.value;
        store.setSorterEvents(target);
    })

    document.querySelector("header").addEventListener("click", async (e) => {
        if (e.target.id === "logout") await store.logout();
    });
    const btn = document.querySelector(".register-form_button_reset");
    btn.addEventListener("click", () => {
        const form = document.getElementById('register-form');
        if (form) form.reset();
        store.resetFormEvents()
    });
    const form = document.getElementById("register-form");
    form.addEventListener("submit", function (event) {
        console.log("submit спрацював");
        event.preventDefault();
        store.submitFormEvents();
        const form = document.getElementById('register-form');
        if (store.getState().events.form.isValid) {
            form.reset();
        }
    })
}
