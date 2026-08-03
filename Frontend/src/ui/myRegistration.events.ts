export function bindMyRegistrationsEvents(store: any) {
  (document.querySelector("header") as HTMLElement).addEventListener("click", async (e: Event) => {
    const t = e.target as HTMLElement;
    if (t.id === "logout") await store.logout();
  });

  const tbody = document.querySelector(".register_table_body") as HTMLElement;
  tbody.addEventListener("click", async (e: Event) => {
    const target = e.target as HTMLElement;
    const btn = target.closest(".cancel-btn") as HTMLButtonElement | null;
    if (!btn) return;

    (btn as HTMLButtonElement).disabled = true;
    (btn as HTMLButtonElement).textContent = 'Скасування...';

    const ok = await store.deleteRegistration(Number((btn as HTMLButtonElement).dataset.id));
    if (!ok) {
      (btn as HTMLButtonElement).disabled = false;
      (btn as HTMLButtonElement).textContent = 'Скасувати';
    }
  });

  store.subscribe((state: any) => {
    const spinner = document.querySelector(".spinner") as HTMLElement;
    const wrapper = document.querySelector(".spinner-wrapper") as HTMLElement;
    if (state.registration.isLoading || state.auth.isLoading) {
      spinner.classList.remove("hidden");
      wrapper.classList.remove("hidden");
      (wrapper as HTMLElement).style.pointerEvents = 'auto';
    } else {
      spinner.classList.add("hidden");
      wrapper.classList.add("hidden");
      (wrapper as HTMLElement).style.pointerEvents = 'none';
    }
  });
}
