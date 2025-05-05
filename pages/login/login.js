const container = document.getElementById("container");
const registerBtn = document.getElementById("register");
const loginBtn = document.getElementById("login");
const signUpForm = document.getElementById("signUpForm");
const signUpNameInput = document.getElementById("signUpName");
const signUpEmailInput = document.getElementById("signUpEmail");
const signUpPasswordInput = document.getElementById("signUpPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");
const signUpError = document.getElementById("signUpError");
const signInForm = document.getElementById("signInForm");
const signInEmailInput = document.getElementById("signInEmail");
const signInPasswordInput = document.getElementById("signInPassword");
const signInError = document.getElementById("signInError");
const USERS_STORAGE_KEY = "users";
const CURRENT_USER_STORAGE_KEY = "currentUser";

if (registerBtn && loginBtn && container) {
  registerBtn.addEventListener("click", () => {
    container.classList.add("active");
    if (signInError) signInError.textContent = "";
    if (signUpError) signUpError.textContent = "";
  });
  loginBtn.addEventListener("click", () => {
    container.classList.remove("active");
    if (signInError) signInError.textContent = "";
    if (signUpError) signUpError.textContent = "";
  });
}
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

if (signUpForm) {
  signUpForm.addEventListener("submit", function (e) {
    e.preventDefault();
    if (
      !signUpError ||
      !signUpNameInput ||
      !signUpEmailInput ||
      !signUpPasswordInput ||
      !confirmPasswordInput
    )
      return;
    signUpError.textContent = "";
    signUpError.style.color = "red";
    const name = signUpNameInput.value.trim(),
      email = signUpEmailInput.value.trim(),
      password = signUpPasswordInput.value,
      confirm = confirmPasswordInput.value;
    if (name === "") {
      signUpError.textContent = "Họ tên không được trống.";
      return;
    }
    if (email === "") {
      signUpError.textContent = "Email không được trống.";
      return;
    }
    if (!isValidEmail(email)) {
      signUpError.textContent = "Email không đúng định dạng.";
      return;
    }
    if (password === "") {
      signUpError.textContent = "Mật khẩu không được trống.";
      return;
    }
    if (password.length < 8) {
      signUpError.textContent = "Mật khẩu ít nhất 8 ký tự.";
      return;
    }
    if (confirm === "") {
      signUpError.textContent = "Vui lòng xác nhận mật khẩu.";
      return;
    }
    if (password !== confirm) {
      signUpError.textContent = "Mật khẩu xác nhận không khớp.";
      return;
    }
    if (email.toLowerCase() === "admin6868@gmail.com") {
      signUpError.textContent = "Không thể đăng ký bằng email này.";
      return;
    }
    const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY)) || [];
    const emailExists = users.some(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
    if (emailExists) {
      signUpError.textContent = "Email này đã được sử dụng.";
      return;
    }
    users.push({ name, email, password, role: "user" });
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    signUpError.style.color = "green";
    signUpError.textContent = "Đăng ký thành công! Vui lòng đăng nhập.";
    signUpForm.reset();
    setTimeout(() => {
      if (container) container.classList.remove("active");
      if (signUpError) signUpError.textContent = "";
    }, 1500);
  });
}

if (signInForm) {
  signInForm.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!signInError || !signInEmailInput || !signInPasswordInput) return;
    signInError.textContent = "";
    signInError.style.color = "red";
    const email = signInEmailInput.value.trim(),
      password = signInPasswordInput.value;
    if (!email || !password) {
      signInError.textContent = "Vui lòng nhập email và mật khẩu.";
      return;
    }
    let isLoggedIn = false;
    let redirectUrl = "../home/home.html";
    let loggedInUser = null;
    if (
      email.toLowerCase() === "admin6868@gmail.com" &&
      password === "68686868"
    ) {
      isLoggedIn = true;
      loggedInUser = { email: email, role: "admin", name: "Admin" };
    } else {
      const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY)) || [];
      loggedInUser = users.find(
        (user) =>
          user.email.toLowerCase() === email.toLowerCase() &&
          user.password === password
      );
      if (loggedInUser) {
        isLoggedIn = true;
        if (!loggedInUser.role) loggedInUser.role = "user";
      }
    }
    if (isLoggedIn && loggedInUser) {
      signInError.style.color = "green";
      signInError.textContent = "Đăng nhập thành công! Đang chuyển hướng...";
      localStorage.setItem(
        CURRENT_USER_STORAGE_KEY,
        JSON.stringify(loggedInUser)
      );
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 1000);
    } else {
      signInError.textContent = "Email hoặc mật khẩu không đúng!";
      signInPasswordInput.value = "";
      signInPasswordInput.focus();
    }
  });
}
