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

if (registerBtn && loginBtn && container) {
  registerBtn.addEventListener("click", () => {
    container.classList.add("active");
    signInError.textContent = '';
    signUpError.textContent = '';
  });

  loginBtn.addEventListener("click", () => {
    container.classList.remove("active");
    signUpError.textContent = '';
    signInError.textContent = '';
  });
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

if (signUpForm) {
  signUpForm.addEventListener("submit", function(e) {
    e.preventDefault();
    signUpError.textContent = "";
    signUpError.style.color = "red";

    const name = signUpNameInput.value.trim();
    const email = signUpEmailInput.value.trim();
    const password = signUpPasswordInput.value;
    const confirm = confirmPasswordInput.value;

    let isValid = true;

    if (name === "") {
      signUpError.textContent = "Họ và tên không được để trống.";
      isValid = false;
    }
    else if (email === "") {
      signUpError.textContent = "Email không được để trống.";
      isValid = false;
    } else if (!isValidEmail(email)) {
      signUpError.textContent = "Email không đúng định dạng.";
      isValid = false;
    }
    else if (password === "") {
      signUpError.textContent = "Mật khẩu không được để trống.";
      isValid = false;
    } else if (password.length < 8) {
      signUpError.textContent = "Mật khẩu phải có ít nhất 8 ký tự.";
      isValid = false;
    }
    else if (confirm === "") {
      signUpError.textContent = "Vui lòng xác nhận mật khẩu.";
      isValid = false;
    } else if (password !== confirm) {
      signUpError.textContent = "Mật khẩu xác nhận không khớp.";
      isValid = false;
    }

    if (!isValid) {
      return;
    }

    // --- Check if admin email is being registered ---
    if (email === 'admin6868@gmail.com') {
        signUpError.textContent = "Không thể đăng ký bằng email này.";
        isValid = false;
    }

    if (!isValid) {
        return;
    }


    const users = JSON.parse(localStorage.getItem("users")) || [];
    const emailExists = users.some(user => user.email === email);

    if (emailExists) {
      signUpError.textContent = "Email này đã được sử dụng.";
      isValid = false;
    }

    if (isValid) {
      // Add role for regular users
      users.push({ name, email, password, role: 'user' });
      localStorage.setItem("users", JSON.stringify(users));

      signUpError.style.color = "green";
      signUpError.textContent = "Đăng ký thành công! Vui lòng đăng nhập.";

      signUpForm.reset();

      setTimeout(() => {
          if(container) container.classList.remove("active");
           signUpError.textContent = '';
      }, 1500);
    }
  });
}

if (signInForm) {
  signInForm.addEventListener("submit", function (e) {
    e.preventDefault();
    signInError.textContent = "";
    signInError.style.color = "red";

    const email = signInEmailInput.value.trim();
    const password = signInPasswordInput.value;

    if (!email || !password) {
      signInError.textContent = "Vui lòng nhập email và mật khẩu.";
      return;
    }

    let isLoggedIn = false;
    let redirectUrl = '';
    let loggedInUser = null;

    // --- Check for Admin first ---
    if (email === 'admin6868@gmail.com' && password === '68686868') {
        isLoggedIn = true;
        // ***** THAY ĐỔI Ở ĐÂY: Chuyển admin về trang home *****
        redirectUrl = '../home/home.html'; // Admin redirects to home
        loggedInUser = { email: email, role: 'admin', name: 'Admin' }; // Create admin user object
    } else {
        // --- Check for regular users in localStorage ---
        const users = JSON.parse(localStorage.getItem("users")) || [];
        const foundUser = users.find(user => user.email === email && user.password === password);

        if (foundUser) {
            isLoggedIn = true;
            redirectUrl = '../home/home.html'; // Regular user redirects to home
            loggedInUser = foundUser; // Use the found user object (should have role:'user')
        }
    }

    // --- Handle login result ---
    if (isLoggedIn && loggedInUser) {
        signInError.style.color = "green";
        signInError.textContent = "Đăng nhập thành công! Đang chuyển hướng...";

        // Save user info (including role) to localStorage with key 'currentUser'
        // ** QUAN TRỌNG: Key là 'currentUser' như bạn đã dùng **
        localStorage.setItem("currentUser", JSON.stringify(loggedInUser));

        setTimeout(() => {
            window.location.href = redirectUrl;
        }, 1500);

    } else {
        // Login failed
        signInError.textContent = "Email hoặc mật khẩu không đúng!";
        signInPasswordInput.value = "";
        signInPasswordInput.focus();
    }
  });
}