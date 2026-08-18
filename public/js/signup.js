document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signupForm");
  const password = document.getElementById("memberPassword");
  const confirmPassword = document.getElementById("confirmPassword");
  const message = document.getElementById("formMessage");

  document.querySelectorAll("[data-password-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.passwordToggle);
      const shouldShow = input.type === "password";
      input.type = shouldShow ? "text" : "password";
      button.textContent = shouldShow ? "Hide" : "Show";
      button.setAttribute("aria-label", shouldShow ? "Hide password" : "Show password");
    });
  });

  form.addEventListener("submit", (event) => {
    const fields = [password, confirmPassword];
    fields.forEach((field) => field.classList.remove("input-error"));
    message.textContent = "";

    if (!form.checkValidity()) {
      event.preventDefault();
      message.textContent = "Please complete all required fields correctly.";
      return;
    }

    if (password.value !== confirmPassword.value) {
      event.preventDefault();
      password.classList.add("input-error");
      confirmPassword.classList.add("input-error");
      message.textContent = "Passwords do not match.";
      confirmPassword.focus();
    }
  });
});
