# Event-management-system

Вебзастосунок для управління подіями та реєстраціями з JWT автентифікацією.

---

## Запуск проекту

Проект складається з двох частин — бекенд і фронтенд, які запускаються окремо.

### 1. Встановити залежності

```bash
# Бекенд
cd Backend
npm install

# Фронтенд
cd Frontend
npm install
```

### 2. Налаштувати змінні середовища

Створити файл `.env` в кореневій папці проекту:

```env
PORT=3000
ACCESS_TOKEN_SECRET=your_access_secret_min_32_chars
REFRESH_TOKEN_SECRET=your_refresh_secret_min_32_chars
NODE_ENV=development
```

### 3. Запустити

```bash
# Термінал 1 — Бекенд
cd Backend
npm run dev

# Термінал 2 — Фронтенд
cd Frontend
npm run start
```

- Бекенд: `http://localhost:3000`
- Фронтенд: `http://localhost:8080`
- Документація API (Swagger): `http://localhost:3000/api/docs`

---

## Архітектура

```
FIT_webapp/
├── Backend/
│   ├── src/
│   │   ├── routes/         # Маршрути
│   │   ├── controller/     # Контролери
│   │   ├── service/        # Бізнес логіка
│   │   ├── repository/     # SQL запити
│   │   ├── middleware/     # auth, role, validation
│   │   ├── errors/         # AppError, globalErrorHandler
│   │   └── tokens/         # JWT генерація
│   └── migrations/         # SQL міграції
└── Frontend/
    ├── pages/              # HTML сторінки
    ├── src/
    │   ├── api/            # fetch запити до API
    │   ├── state/          # store, initialState
    │   └── ui/             # рендер функції
    └── css/
```

---

## API Endpoints

### Автентифікація

| Метод | Шлях | Опис |
|-------|------|------|
| POST | `/api/v1/auth/registration` | Реєстрація |
| POST | `/api/v1/auth/login` | Логін |
| POST | `/api/v1/auth/refresh` | Оновлення access token |
| POST | `/api/v1/auth/logout` | Вихід |
| GET | `/api/v1/auth/me` | Перевірка токена |

### Події

| Метод | Шлях | Доступ |
|-------|------|--------|
| GET | `/api/v1/events` | Всі |
| GET | `/api/v1/events/:id` | Всі |
| POST | `/api/v1/events` | ADMIN |
| PUT | `/api/v1/events/:id` | ADMIN |
| DELETE | `/api/v1/events/:id` | ADMIN |

### Користувачі

| Метод | Шлях | Доступ |
|-------|------|--------|
| GET | `/api/v1/users` | ADMIN |
| GET | `/api/v1/users/:id` | ADMIN |
| PATCH | `/api/v1/users/:id` | ADMIN |
| DELETE | `/api/v1/users/:id` | ADMIN |

### Реєстрації

| Метод | Шлях | Доступ |
|-------|------|--------|
| GET | `/api/v1/registrations` | ADMIN |
| POST | `/api/v1/registrations` | USER |
| PATCH | `/api/v1/registrations/:id` | USER (свої) / ADMIN |
| DELETE | `/api/v1/registrations/:id` | USER (свої) / ADMIN |

---

## Приклади запитів

### Реєстрація користувача

```http
POST http://localhost:3000/api/v1/auth/register
Content-Type: application/json

{
  "name": "Іван Петренко",
  "email": "ivan@example.com",
  "password": "password123"
}
```

### Логін

```http
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "email": "ivan@example.com",
  "password": "password123"
}
```

Відповідь:
```json
{
  "user": { "id": 1, "name": "Іван Петренко", "role": "USER" },
  "accessToken": "eyJ..."
}
```

### Захищений запит

```http
GET http://localhost:3000/api/v1/events
Authorization: Bearer eyJ...
```

### Оновлення токена

```http
POST http://localhost:3000/api/v1/auth/refresh
Cookie: refreshToken=eyJ...
```

---

## Безпека (Лабораторна №5)

### Таблиця вразливостей

| Вразливість | Наслідок | Виправлення |
|-------------|----------|-------------|
| SQL Injection | Витік або модифікація даних БД | Параметризовані запити (`?`) |
| XSS | Виконання шкідливого JS в браузері | `escapeHtml()` + `textContent` |
| IDOR | Доступ до чужих даних | Перевірка `userId` на бекенді |
| Misconfiguration | Витік внутрішніх деталей, CORS атаки | Security headers + whitelist CORS |

---

### A. SQL Injection

**До (вразливо):**
```js
const sql = `SELECT * FROM Events WHERE name LIKE '%${req.query.search}%'`;
```

**Після (виправлено):**
```js
const sql = `SELECT * FROM Events WHERE name LIKE ?`;
db.all(sql, [`%${req.query.search}%`]);
```

**Перевірка:**
```http
GET /api/v1/events?search=' OR '1'='1
# Повертає звичайний порожній результат, не всі записи
```

---

### Б. XSS

**До (вразливо):**
```js
tbody.innerHTML += `<td>${item.name}</td>`;
```

**Після (виправлено):**
```js
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
// Використовується у всіх рендер функціях
tbody.innerHTML += `<td>${escapeHtml(item.name)}</td>`;
```

**Перевірка:**
```
Ввести у поле назви: <script>alert('XSS')</script>
До: виконується alert
Після: відображається як текст
```

---

### В. IDOR (Broken Access Control)

**До (вразливо):**
```js
// Будь-який користувач міг змінити чужу реєстрацію
app.patch('/registrations/:id', async (req, res) => {
    await service.updateRegistration(req.params.id, req.body);
});
```

**Після (виправлено):**
```ts
const userId = req.user.userId;
const check = await service.getRegistrationById(params.id);

if (!isAdmin && check.userId !== userId) {
    return next(new AppError(403, 'FORBIDDEN', 'You can only cancel your own registration'));
}
```

**Перевірка:**
```http
# Спроба змінити чужу реєстрацію
PATCH /api/v1/registrations/5
Authorization: Bearer <токен іншого юзера>

# Відповідь: 403 FORBIDDEN
```

---

### Г. Security Misconfiguration

**Безпечні HTTP заголовки:**
```ts
res.setHeader("X-Content-Type-Options", "nosniff");
res.setHeader("X-Frame-Options", "DENY");
res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
res.setHeader("X-XSS-Protection", "1; mode=block");
res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
```

**CORS whitelist (не `*`):**
```ts
app.use(cors({
    origin: ["http://127.0.0.1:8080", "http://localhost:8080"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));
```

**Помилки без dev-деталей у production:**
```ts
// Клієнт отримує:
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Internal Server Error",
    "details": null  // деталі тільки в dev режимі
  }
}
```

**Перевірка заголовків:**
```bash
curl -I http://localhost:3000/health
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# Referrer-Policy: strict-origin-when-cross-origin
```

---

## JWT Автентифікація

### Схема токенів

```
Access Token  — 15 хвилин, передається в Authorization header
Refresh Token — 7 днів, зберігається в httpOnly cookie
```

### Флоу

```
1. POST /auth/login → access token (JSON) + refresh token (cookie)
2. GET /api/v1/events + Authorization: Bearer <access> → дані
3. Access прострочився → POST /auth/refresh → новий access token
4. POST /auth/logout → токени відкликані
```

### Ролі

| Роль | Доступ |
|------|--------|
| `USER` | Читання подій, свої реєстрації |
| `ADMIN` | Повний CRUD, всі реєстрації, управління юзерами |

---

## Формат помилок

Всі помилки повертаються в єдиному форматі:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "User not found",
    "details": null
  }
}
```

| Код | Статус | Опис |
|-----|--------|------|
| `UNAUTHORIZED` | 401 | Токен відсутній |
| `TOKEN_EXPIRED` | 401 | Токен прострочений |
| `FORBIDDEN` | 403 | Немає доступу|
| `NOT_FOUND` | 404 | Ресурс не знайдено |
| `CONFLICT` | 409 | Дублікат (email вже існує) |
| `BAD_REQUEST` | 400 | Невалідні дані |
