import {renderHeader, renderWelcome} from "./events.render.js";
let lastAuthUser = undefined;

export function renderMyRegistrationsApp(state){
    renderRegistrationsTable(state);
    renderHeader(state);
    renderWelcome(state);
}
function renderRegistrationsTable(state) {
    const tbody = document.querySelector(".register_table_body");
    const thead = document.querySelector(".register_table_head");
    const isAdmin = state.auth.user?.role?.toLowerCase() === 'admin';
    const items = state.registrations.list;
    const events = state.events.list;

    if (state.auth.user) {
        thead.innerHTML = `<tr>
            <th>Номер</th>
            <th>Назва події</th>
            <th>Дата події</th>
            <th>Локація</th>
            <th>Ім'я користувача</th>
            <th>Email</th> 
            <th>Статус</th>
            <th>Скасувати</th>
        </tr>`;
    }

    if (!items.length) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center">Реєстрацій ще немає</td></tr>`;
        return;
    }

    tbody.innerHTML = items.map((item, index) => {
        const event = events.find(e => e.id === item.eventId);
        const eventName = event?.name ?? '—';
        const eventDate = event ? new Date(event.date).toLocaleDateString('uk-UA') : '—';
        const eventLocation = event?.location ?? '—';
        const user = state.users.list.find(u => u.id === item.userId);
        const userName = user?.name ?? "—";
        const userEmail = user?.email ?? "—" ;

        return `<tr data-id="${item.id}">
            <td>${index + 1}</td>
            <td>${eventName}</td>
            <td>${eventDate}</td>
            <td>${eventLocation}</td>
            <td>${userName}</td>
            <td>${userEmail}</td>
            <td>${item.status ?? '—'}</td>
            <td><button class="cancel-btn" data-id="${item.id}">Скасувати</button></td>
        </tr>`;
    }).join('');
}

