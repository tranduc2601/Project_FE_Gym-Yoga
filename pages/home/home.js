// --- Constants ---
const SERVICE_STORAGE_KEY = "gymServices";
const USER_STORAGE_KEY = "currentUser";
const SCHEDULE_STORAGE_KEY = "schedules";

// --- Pagination State ---
let popularClassesCurrentPage = 1;
const popularClassesItemsPerPage = 3;
let allServices = []; // Cache all services

// --- DOM Elements ---
const userInfoLi = document.getElementById("user-info");
const usernameSpan = document.getElementById("username");
const manageLink = document.getElementById("manage-link");
const logoutButton = document.getElementById("logout-button");
const loginLinkLi = document.getElementById("login-link-li");
const popularClassesContainer = document.getElementById(
  "popular-classes-container"
);
const paginationControls = document.getElementById("home-pagination-controls");
const bookingModal = document.getElementById("booking-modal-on-home");
const bookingModalTitle = document.getElementById("booking-modal-title");
const bookingForm = document.getElementById("booking-modal-form");
const bookingClassTypeInput = document.getElementById("booking-class-type");
const bookingScheduleDateInput = document.getElementById(
  "booking-schedule-date"
);
const bookingScheduleTimeInput = document.getElementById(
  "booking-schedule-time"
);
const bookingFullNameInput = document.getElementById("booking-full-name");
const bookingEmailInput = document.getElementById("booking-email");
const bookingModalError = document.getElementById("booking-modal-error");
const homeModalCloseButtons = document.querySelectorAll(".home-modal-close");
const loginPromptModal = document.getElementById("login-prompt-modal");
const loginPromptCloseButtons = document.querySelectorAll(
  ".login-prompt-close"
);
const bookingSuccessModal = document.getElementById("booking-success-modal");
const bookingSuccessCloseButtons = document.querySelectorAll(
  ".booking-success-close"
);

// --- Utility Functions ---
function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_STORAGE_KEY));
  } catch (e) {
    return null;
  }
}
function getAllSchedules() {
  try {
    const stored = localStorage.getItem(SCHEDULE_STORAGE_KEY);
    const schedules = stored ? JSON.parse(stored) : [];
    return Array.isArray(schedules) ? schedules : [];
  } catch (e) {
    console.error("Error reading schedules:", e);
    return [];
  }
}
function saveSchedules(schedules) {
  if (Array.isArray(schedules)) {
    localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(schedules));
  }
}

// --- Core Logic Functions ---
function checkLoginStatus() {
  const userInfo = getCurrentUser();
  if (
    !userInfoLi ||
    !usernameSpan ||
    !manageLink ||
    !logoutButton ||
    !loginLinkLi
  )
    return;
  if (userInfo && userInfo.email) {
    usernameSpan.textContent = userInfo.name || userInfo.email;
    userInfoLi.style.display = "inline-block";
    loginLinkLi.style.display = "none";
    manageLink.style.display = userInfo.role === "admin" ? "inline" : "none";
    logoutButton.removeEventListener("click", handleLogout);
    logoutButton.addEventListener("click", handleLogout);
  } else {
    userInfoLi.style.display = "none";
    loginLinkLi.style.display = "inline-block";
    manageLink.style.display = "none";
  }
}
function handleLogout() {
  localStorage.removeItem(USER_STORAGE_KEY);
  window.location.href = "../login/login.html";
}
function loadAllServices() {
  const storedServices = localStorage.getItem(SERVICE_STORAGE_KEY);
  try {
    allServices = storedServices ? JSON.parse(storedServices) : [];
    if (!Array.isArray(allServices)) allServices = [];
  } catch (e) {
    console.error("Error parsing services:", e);
    allServices = [];
  }
}
function renderPopularClasses() {
  if (!popularClassesContainer || !paginationControls) return;
  popularClassesContainer.innerHTML = "";
  paginationControls.innerHTML = "";
  if (allServices.length === 0) {
    popularClassesContainer.innerHTML =
      '<p style="text-align: center; color: #6c757d;">Hiện chưa có lớp học nào.</p>';
    return;
  }
  const totalItems = allServices.length;
  const totalPages = Math.ceil(totalItems / popularClassesItemsPerPage);
  if (popularClassesCurrentPage < 1) popularClassesCurrentPage = 1;
  if (popularClassesCurrentPage > totalPages && totalPages > 0)
    popularClassesCurrentPage = totalPages;
  const startIndex =
    (popularClassesCurrentPage - 1) * popularClassesItemsPerPage;
  const endIndex = startIndex + popularClassesItemsPerPage;
  const servicesToShow = allServices.slice(startIndex, endIndex);
  if (servicesToShow.length === 0 && popularClassesCurrentPage > 1) {
    popularClassesCurrentPage--;
    renderPopularClasses();
    return;
  }
  servicesToShow.forEach((service) => {
    const card = document.createElement("article");
    card.className = "class-card";
    const imageUrl =
      service.imageUrl || "https://via.placeholder.com/300x200?text=No+Image";
    const name = service.name || "N/A";
    const description = service.description || "";
    card.innerHTML = `<div class="class-image" style="background-image: url('${imageUrl}');"></div><h3>${name}</h3><p>${description}</p><button class="btn btn-primary btn-book-from-home" data-service-name="${name}">Đặt lịch</button>`;
    popularClassesContainer.appendChild(card);
  });
  renderPaginationControls(totalPages);
  attachBookingButtonListeners();
}
function renderPaginationControls(totalPages) {
  if (!paginationControls || totalPages <= 1) {
    if (paginationControls) paginationControls.innerHTML = "";
    return;
  }
  paginationControls.innerHTML = "";
  const prevLi = document.createElement("li");
  prevLi.className = "page-item";
  if (popularClassesCurrentPage === 1) {
    prevLi.classList.add("disabled");
    prevLi.innerHTML = `<span>«</span>`;
  } else {
    prevLi.innerHTML = `<a href="#" data-page="${
      popularClassesCurrentPage - 1
    }">«</a>`;
  }
  paginationControls.appendChild(prevLi);
  for (let i = 1; i <= totalPages; i++) {
    const pageLi = document.createElement("li");
    pageLi.className = "page-item";
    if (i === popularClassesCurrentPage) {
      pageLi.classList.add("active");
      pageLi.innerHTML = `<span>${i}</span>`;
    } else {
      pageLi.innerHTML = `<a href="#" data-page="${i}">${i}</a>`;
    }
    paginationControls.appendChild(pageLi);
  }
  const nextLi = document.createElement("li");
  nextLi.className = "page-item";
  if (popularClassesCurrentPage === totalPages) {
    nextLi.classList.add("disabled");
    nextLi.innerHTML = `<span>»</span>`;
  } else {
    nextLi.innerHTML = `<a href="#" data-page="${
      popularClassesCurrentPage + 1
    }">»</a>`;
  }
  paginationControls.appendChild(nextLi);
  paginationControls.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const page = parseInt(e.target.dataset.page);
      if (page && page !== popularClassesCurrentPage) {
        popularClassesCurrentPage = page;
        renderPopularClasses();
      }
    });
  });
}
function attachBookingButtonListeners() {
  if (!popularClassesContainer) return;
  popularClassesContainer
    .querySelectorAll(".btn-book-from-home")
    .forEach((button) => {
      button.removeEventListener("click", handleBookButtonClick);
      button.addEventListener("click", handleBookButtonClick);
    });
}
function handleBookButtonClick(event) {
  const currentUserInfo = getCurrentUser();
  if (!currentUserInfo || !currentUserInfo.email) {
    showLoginPromptModal();
    return;
  }
  const serviceName = event.target.dataset.serviceName;
  openBookingModal(serviceName);
}

// --- Booking Modal Logic ---
function loadServicesIntoBookingDropdown() {
  if (!bookingClassTypeInput) return;
  bookingClassTypeInput.innerHTML =
    '<option value="">-- Chọn lớp học --</option>';
  if (allServices.length > 0) {
    allServices.forEach((service) => {
      const option = document.createElement("option");
      option.value = service.name;
      option.textContent = service.name;
      bookingClassTypeInput.appendChild(option);
    });
    bookingClassTypeInput.disabled = false;
  } else {
    bookingClassTypeInput.innerHTML =
      '<option value="">-- Chưa có dịch vụ --</option>';
    bookingClassTypeInput.disabled = true;
  }
}
function openBookingModal(selectedService = null) {
  if (
    !bookingModal ||
    !bookingForm ||
    !bookingModalError ||
    !bookingClassTypeInput ||
    !bookingFullNameInput ||
    !bookingEmailInput
  )
    return;
  hideAllModals();
  bookingForm.reset();
  bookingModalError.textContent = "";
  loadServicesIntoBookingDropdown();
  if (
    selectedService &&
    bookingClassTypeInput.querySelector(`option[value="${selectedService}"]`)
  ) {
    bookingClassTypeInput.value = selectedService;
  }
  const currentUserInfo = getCurrentUser();
  if (currentUserInfo) {
    bookingFullNameInput.value = currentUserInfo.name || "";
    bookingEmailInput.value = currentUserInfo.email || "";
    bookingFullNameInput.readOnly = true;
    bookingEmailInput.readOnly = true;
  } else {
    bookingFullNameInput.readOnly = false;
    bookingEmailInput.readOnly = false;
  }
  bookingModal.style.display = "flex";
}
function hideBookingModal() {
  if (bookingModal) bookingModal.style.display = "none";
}
function validateBookingForm() {
  if (
    !bookingModalError ||
    !bookingClassTypeInput ||
    !bookingScheduleDateInput ||
    !bookingScheduleTimeInput ||
    !bookingFullNameInput ||
    !bookingEmailInput
  )
    return false;
  bookingModalError.textContent = "";
  const type = bookingClassTypeInput.value,
    date = bookingScheduleDateInput.value,
    time = bookingScheduleTimeInput.value;
  const name = bookingFullNameInput.value.trim(),
    email = bookingEmailInput.value.trim();
  if (!type || !date || !time || !name || !email) {
    bookingModalError.textContent =
      "Vui lòng chọn đầy đủ lớp học, ngày và giờ.";
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    bookingModalError.textContent = "Định dạng email không hợp lệ.";
    return false;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDate = new Date(date);
  selectedDate.setMinutes(
    selectedDate.getMinutes() + selectedDate.getTimezoneOffset()
  );
  selectedDate.setHours(0, 0, 0, 0);
  if (selectedDate < today) {
    bookingModalError.textContent =
      "Ngày đặt lịch phải là ngày hiện tại hoặc trong tương lai.";
    return false;
  }
  const schedules = getAllSchedules();
  const isDuplicate = schedules.some(
    (s) =>
      s.email.toLowerCase() === email.toLowerCase() &&
      s.date === date &&
      s.time === time &&
      s.type === type &&
      s.status !== "cancelled"
  );
  if (isDuplicate) {
    bookingModalError.textContent =
      "Bạn đã có lịch tập trùng thời gian và lớp học này (đang chờ hoặc đã duyệt).";
    return false;
  }
  return true;
}
function handleBookingFormSubmit(event) {
  event.preventDefault();
  if (!validateBookingForm()) return;
  const newSchedule = {
    id: `sch_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    type: bookingClassTypeInput.value,
    date: bookingScheduleDateInput.value,
    time: bookingScheduleTimeInput.value,
    name: bookingFullNameInput.value.trim(),
    email: bookingEmailInput.value.trim(),
    status: "pending",
  };
  const schedules = getAllSchedules();
  schedules.push(newSchedule);
  saveSchedules(schedules);
  hideBookingModal();
  showBookingSuccessModal();
}

// --- Login Prompt Modal Logic ---
function showLoginPromptModal() {
  if (loginPromptModal) {
    hideAllModals();
    loginPromptModal.style.display = "flex";
  } else {
    console.error("Login prompt modal not found!");
    alert("Vui lòng đăng nhập để đặt lịch!");
    window.location.href = "../login/login.html";
  }
}
function hideLoginPromptModal() {
  if (loginPromptModal) loginPromptModal.style.display = "none";
}

// --- Booking Success Modal Logic ---
function showBookingSuccessModal() {
  if (bookingSuccessModal) {
    hideAllModals();
    bookingSuccessModal.style.display = "flex";
  } else {
    console.error("Booking success modal not found!");
    alert("Đặt lịch thành công! Vui lòng chờ quản trị viên duyệt.");
  }
}
function hideBookingSuccessModal() {
  if (bookingSuccessModal) bookingSuccessModal.style.display = "none";
}

// --- Utility to Hide All Modals ---
function hideAllModals() {
  hideBookingModal();
  hideLoginPromptModal();
  hideBookingSuccessModal();
}

// --- Event Listeners Setup ---
document.addEventListener("DOMContentLoaded", () => {
  checkLoginStatus();
  loadAllServices();
  popularClassesCurrentPage = 1;
  renderPopularClasses();
  if (bookingForm) {
    bookingForm.addEventListener("submit", handleBookingFormSubmit);
  }
  homeModalCloseButtons.forEach((button) =>
    button.addEventListener("click", hideBookingModal)
  );
  loginPromptCloseButtons.forEach((button) =>
    button.addEventListener("click", hideLoginPromptModal)
  );
  bookingSuccessCloseButtons.forEach((button) =>
    button.addEventListener("click", hideBookingSuccessModal)
  );
  window.addEventListener("click", (event) => {
    if (event.target === bookingModal) hideBookingModal();
    if (event.target === loginPromptModal) hideLoginPromptModal();
    if (event.target === bookingSuccessModal) hideBookingSuccessModal();
  });
});
