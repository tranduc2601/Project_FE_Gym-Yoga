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

// Constants for storage keys
const USERS_STORAGE_KEY = "users";
const CURRENT_USER_STORAGE_KEY = "currentUser";

if (registerBtn && loginBtn && container) {
  registerBtn.addEventListener("click", () => {
    container.classList.add("active");
    if(signInError) signInError.textContent = ''; // Clear errors on toggle
    if(signUpError) signUpError.textContent = '';
  });

  loginBtn.addEventListener("click", () => {
    container.classList.remove("active");
    if(signInError) signInError.textContent = ''; // Clear errors on toggle
    if(signUpError) signUpError.textContent = '';
  });
}

// Email validation helper
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(String(email).toLowerCase());
}

// Sign Up Logic
if (signUpForm) {
  signUpForm.addEventListener("submit", function(e) {
    e.preventDefault(); // Prevent default form submission
    if(!signUpError || !signUpNameInput || !signUpEmailInput || !signUpPasswordInput || !confirmPasswordInput) return; // Element check

    signUpError.textContent = "";
    signUpError.style.color = "red"; // Default error color

    const name = signUpNameInput.value.trim();
    const email = signUpEmailInput.value.trim();
    const password = signUpPasswordInput.value; // No trim for password
    const confirm = confirmPasswordInput.value;

    // Validation checks
    if (name === "") { signUpError.textContent = "Họ và tên không được để trống."; return; }
    if (email === "") { signUpError.textContent = "Email không được để trống."; return; }
    if (!isValidEmail(email)) { signUpError.textContent = "Email không đúng định dạng."; return; }
    if (password === "") { signUpError.textContent = "Mật khẩu không được để trống."; return; }
    if (password.length < 8) { signUpError.textContent = "Mật khẩu phải có ít nhất 8 ký tự."; return; }
    if (confirm === "") { signUpError.textContent = "Vui lòng xác nhận mật khẩu."; return; }
    if (password !== confirm) { signUpError.textContent = "Mật khẩu xác nhận không khớp."; return; }

    // Check against reserved admin email
    if (email.toLowerCase() === 'admin6868@gmail.com') {
        signUpError.textContent = "Không thể đăng ký bằng email này.";
        return;
    }

    // Check if email already exists
    const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY)) || [];
    const emailExists = users.some(user => user.email.toLowerCase() === email.toLowerCase());

    if (emailExists) {
      signUpError.textContent = "Email này đã được sử dụng.";
      return;
    }

    // If all checks pass, add new user with 'user' role
    users.push({ name, email, password, role: 'user' }); // Assign 'user' role
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

    // Success message and reset
    signUpError.style.color = "green";
    signUpError.textContent = "Đăng ký thành công! Vui lòng đăng nhập.";
    signUpForm.reset();

    // Optionally switch back to login form after a delay
    setTimeout(() => {
        if(container) container.classList.remove("active");
        if(signUpError) signUpError.textContent = ''; // Clear success message
    }, 1500); // 1.5 seconds delay
  });
}

// Sign In Logic
if (signInForm) {
  signInForm.addEventListener("submit", function (e) {
    e.preventDefault();
    if(!signInError || !signInEmailInput || !signInPasswordInput) return; // Element check

    signInError.textContent = "";
    signInError.style.color = "red"; // Default error color

    const email = signInEmailInput.value.trim();
    const password = signInPasswordInput.value;

    if (!email || !password) {
      signInError.textContent = "Vui lòng nhập email và mật khẩu.";
      return;
    }

    let isLoggedIn = false;
    let redirectUrl = '../home/home.html'; // Default redirect to home
    let loggedInUser = null;

    // --- Check for Admin ---
    if (email.toLowerCase() === 'admin6868@gmail.com' && password === '68686868') {
        isLoggedIn = true;
        // Admin also redirects to home now, navbar will show 'Quản lý'
        loggedInUser = { email: email, role: 'admin', name: 'Admin' };
    } else {
        // --- Check for regular users in localStorage ---
        const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY)) || [];
        loggedInUser = users.find(user => user.email.toLowerCase() === email.toLowerCase() && user.password === password);
        if (loggedInUser) {
            isLoggedIn = true;
            // Ensure role is set, default to 'user' if missing
            if (!loggedInUser.role) loggedInUser.role = 'user';
        }
    }

    // --- Handle login result ---
    if (isLoggedIn && loggedInUser) {
        signInError.style.color = "green";
        signInError.textContent = "Đăng nhập thành công! Đang chuyển hướng...";

        // Save user info (including role) to localStorage
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(loggedInUser));

        // Redirect after a delay
        setTimeout(() => {
            window.location.href = redirectUrl;
        }, 1000); // 1 second delay

    } else {
        // Login failed
        signInError.textContent = "Email hoặc mật khẩu không đúng!";
        signInPasswordInput.value = ""; // Clear password field
        signInPasswordInput.focus(); // Focus password field
    }
  });
}