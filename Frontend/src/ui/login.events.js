export function bindEventsLogin(store){
    const input = document.querySelectorAll("#register-form input, #register-form textarea");
    input.forEach(el => {
        el.addEventListener("input", (event) => {
            let value = event.target.value.trim();
            store.updateFieldLogin(event.target.name, value )
        })
    })
    const spinner = document.querySelector(".spinner");
    const wrapper = document.querySelector(".spinner-wrapper");

    store.subscribe((state) => {
        if (state.auth.isLoading) {
            spinner.classList.remove("hidden");
            wrapper.classList.remove("hidden");
            wrapper.style.pointerEvents = 'auto';
        } else {
            spinner.classList.add("hidden");
            wrapper.classList.add("hidden");
            wrapper.style.pointerEvents = 'none';
        }
    });
    const btn = document.querySelector(".register-form_button_reset");
    btn.addEventListener("click", () => {
        const form = document.getElementById('register-form');
        if (form) form.reset();
        store.resetFormLogin()
    });
    const form = document.getElementById("register-form");
    form.addEventListener("submit", async function (event) {
        console.log("submit спрацював");
        event.preventDefault();
        await store.submitFormLogin();
        const form = document.getElementById('register-form');
        if (store.getState().login.form.isValid) {
            form.reset();
        }
    })
}