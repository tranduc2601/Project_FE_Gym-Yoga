document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Elements ---
  // *** Đảm bảo tên biến này được sử dụng nhất quán bên dưới ***
  const scheduleTableBody = document.getElementById("schedule-list-body");
  const paginationControls = document.getElementById("pagination-controls");
  const btnAddNew = document.getElementById("btn-add-new");
  const pageTitleElement = document.querySelector(".page-title");
  const modal = document.getElementById("schedule-modal");
  const modalTitle = document.getElementById("modal-title");
  const scheduleForm = document.getElementById("schedule-form");
  const scheduleIdInput = document.getElementById("schedule-id");
  const classTypeInput = document.getElementById("class-type");
  const scheduleDateInput = document.getElementById("schedule-date");
  const scheduleTimeInput = document.getElementById("schedule-time");
  const fullNameInput = document.getElementById("full-name");
  const emailInput = document.getElementById("email");
  const modalError = document.getElementById("modal-error");
  const closeButtons = document.querySelectorAll(
    "#schedule-modal .close-button"
  );
  const deleteModal = document.getElementById("delete-confirm-modal");
  const btnConfirmDelete = document.getElementById("btn-confirm-delete");
  const deleteModalCloseButtons = document.querySelectorAll(
    "#delete-confirm-modal .close-button"
  );

  // --- Data & State ---
  let allSchedules = []; // Dùng allSchedules thay vì schedules
  let currentScheduleIdToDelete = null;
  let currentScheduleToEdit = null;
  let currentPage = 1;
  const itemsPerPage = 5;
  const SCHEDULE_STORAGE_KEY = "schedules";
  const SERVICE_STORAGE_KEY = "gymServices";
  const USER_STORAGE_KEY = "currentUser";

  // --- Functions ---
  function loadSchedules() {
    const storedSchedules = localStorage.getItem(SCHEDULE_STORAGE_KEY);
    try {
      allSchedules = storedSchedules ? JSON.parse(storedSchedules) : [];
      if (!Array.isArray(allSchedules)) allSchedules = [];
    } catch (e) {
      console.error("Error parsing schedules:", e);
      allSchedules = [];
    }
    let needsSave = false;
    allSchedules.forEach((schedule, index) => {
      if (!schedule.id) {
        schedule.id = `sch_${Date.now()}_${index}_${Math.random()
          .toString(36)
          .substr(2, 3)}`;
        needsSave = true;
      }
      if (!schedule.status) {
        schedule.status = "pending";
        needsSave = true;
      }
    });
    if (needsSave) saveSchedules();
  }
  function saveSchedules() {
    localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(allSchedules));
  }
  function loadServicesIntoDropdown() {
    const stored = localStorage.getItem(SERVICE_STORAGE_KEY);
    let services = [];
    try {
      services = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(services)) services = [];
    } catch (e) {
      services = [];
    }
    if (!classTypeInput) return;
    classTypeInput.innerHTML = '<option value="">-- Chọn lớp học --</option>';
    if (services.length > 0) {
      services.forEach((s) => {
        const o = document.createElement("option");
        o.value = s.name;
        o.textContent = s.name;
        classTypeInput.appendChild(o);
      });
      classTypeInput.disabled = false;
    } else {
      classTypeInput.innerHTML =
        '<option value="">-- Chưa có dịch vụ --</option>';
      classTypeInput.disabled = true;
    }
  }
  function validateForm() {
    if (
      !modalError ||
      !classTypeInput ||
      !scheduleDateInput ||
      !scheduleTimeInput ||
      !fullNameInput ||
      !emailInput
    )
      return false;
    modalError.textContent = "";
    const type = classTypeInput.value,
      date = scheduleDateInput.value,
      time = scheduleTimeInput.value,
      name = fullNameInput.value.trim(),
      email = emailInput.value.trim(),
      id = scheduleIdInput.value;
    if (!type || !date || !time || !name || !email) {
      modalError.textContent = "Vui lòng điền đủ thông tin.";
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      modalError.textContent = "Email không hợp lệ.";
      return false;
    }
    const isDuplicate = allSchedules.some(
      (s) =>
        s.email.toLowerCase() === email.toLowerCase() &&
        s.date === date &&
        s.time === time &&
        s.type === type &&
        s.id !== id &&
        s.status !== "cancelled"
    );
    if (isDuplicate) {
      modalError.textContent = "Lịch tập này đã tồn tại.";
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
      modalError.textContent = "Ngày phải là hôm nay hoặc tương lai.";
      return false;
    }
    return true;
  }
  function getStatusInfo(status) {
    switch (status) {
      case "approved":
        return { text: "Đã duyệt", class: "status-approved" };
      case "cancelled":
        return { text: "Đã hủy", class: "status-cancelled" };
      case "pending":
      default:
        return { text: "Chờ duyệt", class: "status-pending" };
    }
  }

  // Hàm render bảng
  function renderTable() {
    // *** LUÔN SỬ DỤNG scheduleTableBody ***
    if (!scheduleTableBody) {
      console.error("renderTable: scheduleTableBody element not found!");
      return;
    }
    scheduleTableBody.innerHTML = ""; // Xóa nội dung cũ

    const currentUserInfo = JSON.parse(localStorage.getItem(USER_STORAGE_KEY));
    const userEmail = currentUserInfo ? currentUserInfo.email : null;
    const userRole = currentUserInfo ? currentUserInfo.role : null;

    let dataToDisplay = [];

    if (userRole === "admin") {
      dataToDisplay = [...allSchedules]; // Admin thấy tất cả
      if (pageTitleElement)
        pageTitleElement.textContent = "Toàn bộ Lịch Tập (Admin View)";
      if (btnAddNew) btnAddNew.style.display = "none";
    } else if (userEmail) {
      dataToDisplay = allSchedules.filter(
        (s) => s.email && s.email.toLowerCase() === userEmail.toLowerCase()
      ); // User chỉ thấy của mình
      if (pageTitleElement) pageTitleElement.textContent = "Lịch tập của bạn";
      if (btnAddNew) btnAddNew.style.display = "inline-block";
    } else {
      scheduleTableBody.innerHTML = `<tr><td colspan="7">Vui lòng đăng nhập.</td></tr>`;
      renderPagination(0, 0);
      if (pageTitleElement) pageTitleElement.textContent = "Lịch tập";
      if (btnAddNew) btnAddNew.style.display = "inline-block";
      return;
    }

    if (dataToDisplay.length === 0) {
      const msg =
        userRole === "admin"
          ? "Chưa có lịch tập nào."
          : "Bạn chưa đặt lịch nào.";
      scheduleTableBody.innerHTML = `<tr><td colspan="7">${msg}</td></tr>`;
      renderPagination(0, 0);
      return;
    }

    // Phân trang
    const totalItems = dataToDisplay.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;
    if (currentPage < 1 || !currentPage) currentPage = 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const sortedData = dataToDisplay.sort((a, b) => {
      /* ... logic sắp xếp ... */
    });
    const itemsToDisplay = sortedData.slice(startIndex, endIndex);
    if (itemsToDisplay.length === 0 && currentPage > 1) {
      currentPage--;
      renderTable();
      return;
    }

    // Hiển thị dòng
    itemsToDisplay.forEach((schedule) => {
      const row = document.createElement("tr");
      const statusInfo = getStatusInfo(schedule.status);
      let canEditDelete = false;
      if (
        currentUserInfo &&
        schedule.email &&
        schedule.email.toLowerCase() === currentUserInfo.email.toLowerCase() &&
        schedule.status === "pending"
      ) {
        canEditDelete = true;
      }
      const editDisabled = !canEditDelete ? "disabled" : "";
      const deleteDisabled = !canEditDelete ? "disabled" : "";
      // *** LUÔN SỬ DỤNG scheduleTableBody ***
      row.innerHTML = `<td>${schedule.type || "N/A"}</td><td>${
        schedule.date || "N/A"
      }</td><td>${schedule.time || "N/A"}</td><td>${
        schedule.name || "N/A"
      }</td><td>${schedule.email || "N/A"}</td><td><span class="status-badge ${
        statusInfo.class
      }">${
        statusInfo.text
      }</span></td><td><button class="btn-edit btn-sm" data-id="${
        schedule.id
      }" ${editDisabled}>Sửa</button><button class="btn-delete btn-sm" data-id="${
        schedule.id
      }" ${deleteDisabled}>Xóa</button></td>`;
      scheduleTableBody.appendChild(row); // *** Đảm bảo append vào biến đúng ***
    });

    addTableButtonListeners();
    renderPagination(totalPages, totalItems);
  }

  // Hàm renderPagination đã sửa lỗi classList
  function renderPagination(totalPages, totalItems) {
    if (!paginationControls) return;
    paginationControls.innerHTML = "";
    if (totalPages <= 1) return;
    function createPageItem(
      content,
      pageNum = null,
      isDisabled = false,
      isActive = false
    ) {
      const li = document.createElement("li");
      li.className = "page-item";
      if (isDisabled) li.classList.add("disabled");
      if (isActive) li.classList.add("active");
      if (pageNum !== null) {
        const a = document.createElement("a");
        a.className = "page-link";
        a.href = "#";
        a.dataset.page = pageNum;
        a.innerHTML = content;
        if (!isDisabled && !isActive) {
          a.addEventListener("click", (e) => {
            e.preventDefault();
            const page = parseInt(e.target.dataset.page);
            if (page && page !== currentPage) {
              currentPage = page;
              renderTable();
            }
          });
        }
        li.appendChild(a);
      } else {
        const span = document.createElement("span");
        span.className = "page-link";
        span.innerHTML = content;
        li.appendChild(span);
      }
      return li;
    }
    paginationControls.appendChild(
      createPageItem("«", currentPage - 1, currentPage === 1)
    );
    const maxPg = 5;
    let stPg = Math.max(1, currentPage - Math.floor(maxPg / 2));
    let endPg = Math.min(totalPages, stPg + maxPg - 1);
    if (endPg - stPg + 1 < maxPg) stPg = Math.max(1, endPg - maxPg + 1);
    if (stPg > 1) {
      paginationControls.appendChild(createPageItem("1", 1));
      if (stPg > 2)
        paginationControls.appendChild(createPageItem("...", null, true));
    }
    for (let i = stPg; i <= endPg; i++) {
      paginationControls.appendChild(
        createPageItem(i, i, false, i === currentPage)
      );
    }
    if (endPg < totalPages) {
      if (endPg < totalPages - 1)
        paginationControls.appendChild(createPageItem("...", null, true));
      paginationControls.appendChild(createPageItem(totalPages, totalPages));
    }
    paginationControls.appendChild(
      createPageItem("»", currentPage + 1, currentPage === totalPages)
    );
  }

  function addTableButtonListeners() {
    if (!scheduleTableBody) return;
    scheduleTableBody
      .querySelectorAll(".btn-edit:not([disabled])")
      .forEach((b) => {
        b.removeEventListener("click", handleEdit);
        b.addEventListener("click", handleEdit);
      });
    scheduleTableBody
      .querySelectorAll(".btn-delete:not([disabled])")
      .forEach((b) => {
        b.removeEventListener("click", handleDelete);
        b.addEventListener("click", handleDelete);
      });
  }
  function showModal(isEdit = false, scheduleData = null) {
    /* ... Giữ nguyên ... */
  }
  function hideModals() {
    /* ... Giữ nguyên ... */
  }
  function handleFormSubmit(event) {
    /* ... Giữ nguyên ... */
  }
  function handleEdit(event) {
    /* ... Giữ nguyên ... */
  }
  function handleDelete(event) {
    /* ... Giữ nguyên ... */
  }
  function confirmDelete() {
    /* ... Giữ nguyên ... */
  }

  // --- Event Listeners ---
  if (btnAddNew) btnAddNew.addEventListener("click", () => showModal(false));
  if (scheduleForm) scheduleForm.addEventListener("submit", handleFormSubmit);
  if (btnConfirmDelete)
    btnConfirmDelete.addEventListener("click", confirmDelete);
  closeButtons.forEach((button) => {
    button.addEventListener("click", hideModals);
  });
  deleteModalCloseButtons.forEach((button) => {
    button.addEventListener("click", hideModals);
  });
  window.addEventListener("click", (event) => {
    if (event.target === modal || event.target === deleteModal) {
      hideModals();
    }
  });

  // --- Initial Load ---
  loadSchedules();
  renderTable();
});
