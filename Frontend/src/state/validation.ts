export type FormShape<TValues extends Record<string, any>> = {
  values: TValues;
  touched: Record<string, boolean>;
  errors: Record<string, string>;
  isValid: boolean;
};

export function validateEventsForm(form: FormShape<{ name: string; date: string; location: string; capacity: string | number; description?: string }>) {
  const errors: Record<string, string> = {};
  const name = form.values.name.trim();
  if (form.touched["name"] && name === "") {
    errors.name = "Поле не може бути порожнім!";
  }
  const date = form.values.date.trim();
  console.log("DATE:", date);
  if (form.touched["date"] && date === "") {
    errors.date = "Поле не може бути порожнім або дата некоректна!";
  } else if (form.touched["date"]) {
    const text = form.values.date.trim();
    const m = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) {
      errors.date = "Неправильна дата!";
    } else {
      const y = Number(m[1]);
      const mo = Number(m[2]);
      const d = Number(m[3]);
      const selected = new Date(Date.UTC(y, mo - 1, d));
      const todayUTC = new Date();
      todayUTC.setUTCHours(0, 0, 0, 0);
      if (selected.getTime() < todayUTC.getTime()) {
        errors.date = "Не можна планувати на минуле!";
      }
    }
  }
  const location = form.values.location.trim();
  if (form.touched["location"] && location === "") {
    errors.location = "Поле не може бути порожнім!";
  }
  const capacityRaw = form.values.capacity; // string | number based on form shape
  if (form.touched["capacity"] && capacityRaw === "") {
    errors.capacity = "Поле не може бути порожнім або Ви ввели не правильне число!";
  } else if (form.touched["capacity"]) {
    const capacity = Number(capacityRaw);
    if (Number.isNaN(capacity) || capacity < 1 || capacity > 200) {
      errors.capacity = "Число має бути в діапазоні 1–200.";
    }
  }
  console.log(errors);
  return errors;
}

export function validateUsersForm(form: FormShape<{ name?: string; email?: string; password?: string }>) {
  const errors: Record<string, string> = {};
  const name = (form.values.name ?? "").trim();
  const email = (form.values.email ?? "").trim();
  const password = form.values.password ?? "";
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (form.touched["name"] && name === "") {
    errors.name = "Поле не може бути порожнім!";
  }
  if (form.touched["email"] && email === "") {
    errors.email = "Поле не може бути порожнім!";
  } else if (form.touched["email"] && emailRegex.test((form.values.email ?? "").trim()) === false) {
    errors.email = "Пошта введена не вірно!";
  }
  if (form.touched["password"] && password === "") {
    errors.password = "Поле не може бути порожнім";
  } else if (form.touched["password"] && (password.length < 8 || password.length > 50)) {
    errors.password = "Пароль має менше ніж 8 символів або більше ніж 50!";
  }
  return errors;
}

export function validateLoginForm(form: FormShape<{ email?: string; password?: string }>) {
  const errors: Record<string, string> = {};
  const email = (form.values.email ?? "").trim();
  const password = form.values.password ?? "";
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (form.touched["email"] && email === "") {
    errors.email = "Поле не може бути порожнім!";
  } else if (form.touched["email"] && emailRegex.test((form.values.email ?? "").trim()) === false) {
    errors.email = "Пошта введена не вірно!";
  }
  if (form.touched["password"] && password === "") {
    errors.password = "Поле не може бути порожнім";
  } else if (form.touched["password"] && (password.length < 8 || password.length > 50)) {
    errors.password = "Пароль має менше ніж 8 символів або більше ніж 50!";
  }
  return errors;
}

export function validateRegistrationForm(form: FormShape<{ name?: string; email?: string; password?: string }>) {
  const errors: Record<string, string> = {};
  const email = (form.values.email ?? "").trim();
  const name = (form.values.name ?? "").trim();
  const password = form.values.password ?? "";
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (form.touched["name"] && name === "") {
    errors.name = "Поле не може бути порожнім!";
  } else if (form.touched["name"] && (name.length < 3 || name.length > 50)) {
    errors.name = "Мало або багато символів";
  }
  if (form.touched["email"] && email === "") {
    errors.email = "Поле не може бути порожнім!";
  } else if (form.touched["email"] && emailRegex.test((form.values.email ?? "").trim()) === false) {
    errors.email = "Пошта введена не вірно!";
  }
  if (form.touched["password"] && password === "") {
    errors.password = "Поле не може бути порожнім";
  } else if (form.touched["password"] && (password.length < 8 || password.length > 50)) {
    errors.password = "Пароль має менше ніж 8 символів або більше ніж 50!";
  }
  return errors;
}

export function validateEditUsersTable(values: { name?: string; email?: string }) {
  // Повертаємо явний обʼєкт без кастів
  const name = (values.name ?? "").trim();
  const email = (values.email ?? "").trim();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return {
    name: name !== "" && name.length <= 50,
    email: email !== "" && email.length <= 50 && emailRegex.test(email),
  } as const;
}

export function validateEditEventsTable(values: { name?: string; date?: string; location?: string; capacity?: string | number; description?: string }) {
  const validationObj: { name: boolean; date: boolean; location: boolean; capacity: boolean; description: boolean } = {
    name: false,
    date: false,
    location: false,
    capacity: false,
    description: false,
  };
  const fields = ["name", "date", "location", "capacity", "description"] as const;
  for (const field of fields) {
    const v = (values[field] ?? "").toString().trim();
    validationObj[field] = v !== "" && v.length <= 50;
  }
  const text = (values.date ?? "").trim();
  let validDate = false;

  const [yyyy, mm, dd] = text.split("-").map(Number);
  const d = new Date(Date.UTC(yyyy, mm - 1, dd));
  validDate = !isNaN(d.getTime()) &&
    d.getUTCFullYear() === yyyy &&
    d.getUTCMonth() === mm - 1 &&
    d.getUTCDate() === dd;
  const todayUTC = new Date();
  todayUTC.setUTCHours(0, 0, 0, 0);
  validDate = validDate && d.getTime() >= todayUTC.getTime();
  console.log("DATE FINAL VALIDATION:", validDate);

  if (!validDate) validationObj.date = false;

  if (validationObj.capacity !== false) {
    const c = Number(values.capacity);
    if (!Number.isFinite(c) || c < 1 || c > 200) {
      validationObj.capacity = false;
    }
  }
  return validationObj;
}
