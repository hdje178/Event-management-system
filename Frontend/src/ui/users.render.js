function renderUsersApp(state) {
    renderUsersTable(state.users);
    renderUsersTableErrors(state.users);
    renderUsersFormErrors(state.users);
    renderUsersForm(state.users);
    console.log("renderEventsApp")
}

export { renderUsersApp };

function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function renderUsersTable(state){
    const tbody = document.querySelector(".register_table_body");
    tbody.innerHTML = "";
    const events = state.ui.filterText? state.ui.filterItems : state.list;
    console.log(events)
    const rowHtml = events.map((item , index) =>{
        const isEditing = state.ui.editingId === item.id;
        const v = isEditing && state.ui.editValues ? state.ui.editValues : null;
        return `
      <tr data-id="${item.id}">
        <td data-id="${item.id}">${index+1}</td>
        <td data-id="${item.id}" ${isEditing? 'contenteditable="true"' : ""}>${escapeHtml(isEditing ? v.name : item.name)}</td>
        <td data-id="${item.id}" ${isEditing? 'contenteditable="true"' : ""}>${escapeHtml(isEditing ? v.email : item.email)}</td>
        <td data-id="${item.id}">${escapeHtml(item.role)}</td>
        <td data-id="${item.id}"><button type="button" class="delete-btn" data-id="${item.id}">Видалити</button></td>
        <td data-id="${item.id}"><button type="button" ${isEditing? 'class="save-btn"' : 'class="edit-btn"'} data-id="${item.id}">${isEditing? "Зберегти" : "Редагувати"}</button></td>
      </tr>`
    }).join("");
    tbody.innerHTML = rowHtml;
}

function renderUsersForm(state) {
    if (Object.keys(state.form.touched).length === 0) {
        const fields = ["name", "email", "password"];
        fields.forEach(field => {
            const input = document.getElementById(`register-form_${field}`);
            if (input) input.value = "";
        });
    }
    const header = document.querySelector("header");
    requestAnimationFrame(() => {
        header.querySelector("nav").classList.add("visible");
    });
}

function renderUsersFormErrors(state) {
    let fields = ["name", "email", "password"];
    let submit_btn = document.querySelector(".register-form_button_submit button");
    fields.forEach(field => {
        let el = document.getElementById(`${field}_error`);
        let input = document.getElementById(`register-form_${field}`);
        const message = state.form.touched[`${field}`] ? state.form.errors[field] ?? "": "";
        el.textContent = message;
        message? input.classList.add("invalid") : input.classList.remove("invalid");
        if (message) {
            el.classList.add("visible");
        } else {
            el.classList.remove("visible");
        }
    });
    submit_btn.disabled = !state.form.isValid;
}
function renderUsersTableErrors(state) {
    if (!state.ui.editErrors) return;
    if (!state.ui.editingId) return;
    let fields = ["name", "email"];
    let cellsEditing = document.querySelectorAll(`td[data-id="${state.ui.editingId}"][contenteditable="true"]`);
    if (!cellsEditing.length) return;
    fields.forEach((field,index) => {
        let el = cellsEditing[index];
        if (state.ui.editErrors[field] === false){
            el.classList.add("error-cell");
        }else {
            el.classList.remove("error-cell");
        }
    })
}