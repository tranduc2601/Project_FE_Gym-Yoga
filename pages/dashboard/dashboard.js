// --- Khai báo biến và DOM Elements ---
let scheduleData = JSON.parse(localStorage.getItem("schedules")) || [];
let allServices = []; // Lưu danh sách dịch vụ
let chartInstance = null;
const SERVICE_STORAGE_KEY = "gymServices";
let dashboardCurrentPage = 1;
const dashboardItemsPerPage = 5;

// DOM Elements (Thêm kiểm tra null sau khi lấy)
const statsContainer = document.getElementById("stats-container");
const pendingCountEl = document.getElementById("pendingCount");
const classTypeFilter = document.getElementById("classTypeFilter");
const emailSearch = document.getElementById("emailSearch");
const dateFilter = document.getElementById("dateFilter");
const statusFilter = document.getElementById("statusFilter");
const scheduleTableBody = document.getElementById("scheduleTable");
const chartCanvas = document.getElementById("chart");
const dashboardPaginationControls = document.getElementById(
  "dashboard-pagination-controls"
);
// Admin Booking Modal Elements
const adminBookingModal = document.getElementById("admin-schedule-modal");
const adminBookingForm = document.getElementById("admin-schedule-form");
const adminClassTypeInput = document.getElementById("admin-class-type");
const adminScheduleDateInput = document.getElementById("admin-schedule-date");
const adminScheduleTimeInput = document.getElementById("admin-schedule-time");
const adminFullNameInput = document.getElementById("admin-full-name");
const adminEmailInput = document.getElementById("admin-email");
const adminModalError = document.getElementById("admin-modal-error");
const btnAdminBook = document.getElementById("btn-admin-book");
const adminModalCloseButtons = document.querySelectorAll(".admin-modal-close");
// Edit Schedule Modal Elements
const editDashModal = document.getElementById("edit-schedule-modal-dash");
const editDashForm = document.getElementById("edit-dash-schedule-form");
const editDashScheduleIdInput = document.getElementById(
  "edit-dash-schedule-id"
);
const editDashClassTypeInput = document.getElementById("edit-dash-class-type");
const editDashScheduleDateInput = document.getElementById(
  "edit-dash-schedule-date"
);
const editDashScheduleTimeInput = document.getElementById(
  "edit-dash-schedule-time"
);
const editDashFullNameInput = document.getElementById("edit-dash-full-name");
const editDashEmailInput = document.getElementById("edit-dash-email");
const editDashStatusInput = document.getElementById("edit-dash-status");
const editDashModalError = document.getElementById("edit-dash-modal-error");
const editDashModalCloseButtons = document.querySelectorAll(
  ".edit-dash-modal-close"
);

// --- Helper Functions ---
function escapeHtml(unsafe = "") {
  const str = String(unsafe);
  return str
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, '"')
    .replace(/'/g, "'");
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
function saveSchedules() {
  try {
    localStorage.setItem("schedules", JSON.stringify(scheduleData));
  } catch (e) {
    console.error("Error saving schedules:", e);
  }
}
function loadServicesIntoAdminDropdown() {
  const stored = localStorage.getItem(SERVICE_STORAGE_KEY);
  let services = [];
  try {
    services = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(services)) services = [];
  } catch (e) {
    services = [];
  }
  if (!adminClassTypeInput) return;
  adminClassTypeInput.innerHTML =
    '<option value="">-- Chọn lớp học --</option>';
  if (services.length > 0) {
    services.forEach((s) => {
      const o = document.createElement("option");
      o.value = s.name;
      o.textContent = s.name;
      adminClassTypeInput.appendChild(o);
    });
    adminClassTypeInput.disabled = false;
  } else {
    adminClassTypeInput.innerHTML =
      '<option value="">-- Chưa có dịch vụ --</option>';
    adminClassTypeInput.disabled = true;
  }
}
function hideAdminModal() {
  if (adminBookingModal) adminBookingModal.style.display = "none";
}
function openAdminBookingModal() {
  if (!adminBookingModal || !adminBookingForm) return;
  hideAllModals();
  adminBookingForm.reset();
  if (adminModalError) adminModalError.textContent = "";
  loadServicesIntoAdminDropdown();
  adminBookingModal.style.display = "flex";
}
function validateAdminBookingForm() {
  if (
    !adminModalError ||
    !adminClassTypeInput ||
    !adminScheduleDateInput ||
    !adminScheduleTimeInput ||
    !adminFullNameInput ||
    !adminEmailInput
  )
    return false;
  adminModalError.textContent = "";
  const type = adminClassTypeInput.value,
    date = adminScheduleDateInput.value,
    time = adminScheduleTimeInput.value,
    name = adminFullNameInput.value.trim(),
    email = adminEmailInput.value.trim();
  if (!type || !date || !time || !name || !email) {
    adminModalError.textContent = "Vui lòng điền đủ thông tin.";
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    adminModalError.textContent = "Email không hợp lệ.";
    return false;
  }
  const isDuplicate = scheduleData.some(
    (s) =>
      s.email.toLowerCase() === email.toLowerCase() &&
      s.date === date &&
      s.time === time &&
      s.type === type &&
      s.status !== "cancelled"
  );
  if (isDuplicate) {
    adminModalError.textContent = "User đã có lịch trùng.";
    return false;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDate = new Date(date);
  selectedDate.setHours(0, 0, 0, 0);
  if (selectedDate < today) {
    adminModalError.textContent = "Ngày phải là hôm nay hoặc tương lai.";
    return false;
  }
  return true;
}
function handleAdminBookingSubmit(event) {
  event.preventDefault();
  if (!validateAdminBookingForm()) return;
  const newSchedule = {
    id: `sch_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    type: adminClassTypeInput.value,
    date: adminScheduleDateInput.value,
    time: adminScheduleTimeInput.value,
    name: adminFullNameInput.value.trim(),
    email: adminEmailInput.value.trim(),
    status: "approved",
  };
  scheduleData.push(newSchedule);
  saveSchedules();
  renderTable();
  updateStatsAndChartData();
  hideAdminModal();
}
function approveSchedule(id) {
  const index = scheduleData.findIndex((item) => item.id === id);
  if (index !== -1 && scheduleData[index].status === "pending") {
    scheduleData[index].status = "approved";
    saveSchedules();
    renderTable();
    updateStatsAndChartData();
  } else {
    console.warn("Cannot approve schedule:", id, scheduleData[index]?.status);
  }
}
function cancelSchedule(id) {
  const index = scheduleData.findIndex((item) => item.id === id);
  if (index !== -1 && scheduleData[index].status === "pending") {
    const item = scheduleData[index];
    if (confirm(`Hủy lịch ${item.date} của ${item.name}?`)) {
      scheduleData[index].status = "cancelled";
      saveSchedules();
      renderTable();
      updateStatsAndChartData();
    }
  } else {
    console.warn("Cannot cancel schedule:", id, scheduleData[index]?.status);
  }
}
function confirmPermanentDelete(id) {
  const s = scheduleData.find((item) => item.id === id);
  if (!s) return;
  if (window.confirm(`XÓA VĨNH VIỄN lịch ${s.type}-${s.date} của ${s.name}?`)) {
    permanentlyDeleteSchedule(id);
  }
}
function permanentlyDeleteSchedule(id) {
  const index = scheduleData.findIndex((item) => item.id === id);
  if (index !== -1) {
    scheduleData.splice(index, 1);
    saveSchedules();
    dashboardCurrentPage = 1;
    renderTable();
    updateStatsAndChartData();
  } else {
    alert("Lỗi: Không tìm thấy lịch.");
  }
}
function hideEditDashModal() {
  if (editDashModal) editDashModal.style.display = "none";
}
function loadServicesAndTimesIntoEditDashDropdown() {
  const stored = localStorage.getItem(SERVICE_STORAGE_KEY);
  let services = [];
  try {
    services = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(services)) services = [];
  } catch (e) {
    services = [];
  }
  if (!editDashClassTypeInput) return;
  editDashClassTypeInput.innerHTML = '<option value="">-- Chọn lớp --</option>';
  if (services.length > 0) {
    services.forEach((s) => {
      const o = document.createElement("option");
      o.value = s.name;
      o.textContent = s.name;
      editDashClassTypeInput.appendChild(o);
    });
    editDashClassTypeInput.disabled = false;
  } else {
    editDashClassTypeInput.disabled = true;
  }
  const times = [
    "06:00 - 07:00",
    "07:00 - 08:00",
    "08:00 - 09:00",
    "17:00 - 18:00",
    "18:00 - 19:00",
    "19:00 - 20:00",
  ];
  editDashScheduleTimeInput.innerHTML =
    '<option value="">-- Chọn giờ --</option>';
  times.forEach((t) => {
    const o = document.createElement("option");
    o.value = t;
    o.textContent = t;
    editDashScheduleTimeInput.appendChild(o);
  });
}
function openDashboardEditModal(id) {
  const s = scheduleData.find((sch) => sch.id === id);
  if (!s || !editDashModal) {
    console.error("Cannot find schedule or edit modal for id:", id);
    return;
  }
  hideAllModals();
  if (editDashForm) editDashForm.reset();
  if (editDashModalError) editDashModalError.textContent = "";
  loadServicesAndTimesIntoEditDashDropdown();
  if (editDashScheduleIdInput) editDashScheduleIdInput.value = s.id;
  setTimeout(() => {
    if (editDashClassTypeInput) editDashClassTypeInput.value = s.type;
    if (editDashScheduleTimeInput) editDashScheduleTimeInput.value = s.time;
    if (editDashStatusInput) editDashStatusInput.value = s.status;
  }, 0);
  if (editDashScheduleDateInput) editDashScheduleDateInput.value = s.date;
  if (editDashFullNameInput) editDashFullNameInput.value = s.name;
  if (editDashEmailInput) editDashEmailInput.value = s.email;
  editDashModal.style.display = "flex";
}
function validateEditDashForm() {
  if (
    !editDashModalError ||
    !editDashClassTypeInput ||
    !editDashScheduleDateInput ||
    !editDashScheduleTimeInput ||
    !editDashFullNameInput ||
    !editDashEmailInput ||
    !editDashStatusInput
  )
    return false;
  editDashModalError.textContent = "";
  const type = editDashClassTypeInput.value,
    date = editDashScheduleDateInput.value,
    time = editDashScheduleTimeInput.value,
    status = editDashStatusInput.value,
    name = editDashFullNameInput.value.trim(),
    email = editDashEmailInput.value.trim(),
    id = editDashScheduleIdInput.value;
  if (!type || !date || !time || !name || !email || !status) {
    editDashModalError.textContent = "Vui lòng điền đủ thông tin.";
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    editDashModalError.textContent = "Email không hợp lệ.";
    return false;
  }
  const isDuplicate = scheduleData.some(
    (s) =>
      s.id !== id &&
      s.email.toLowerCase() === email.toLowerCase() &&
      s.date === date &&
      s.time === time &&
      s.type === type &&
      s.status !== "cancelled"
  );
  if (isDuplicate) {
    editDashModalError.textContent = "Thông tin sửa trùng lịch khác.";
    return false;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDate = new Date(date);
  selectedDate.setHours(0, 0, 0, 0);
  if (selectedDate < today) {
    editDashModalError.textContent = "Ngày phải là hôm nay hoặc tương lai.";
    return false;
  }
  return true;
}
function handleDashboardEditFormSubmit(event) {
  event.preventDefault();
  if (!validateEditDashForm()) return;
  const id = editDashScheduleIdInput.value;
  const index = scheduleData.findIndex((s) => s.id === id);
  if (index === -1) {
    if (editDashModalError)
      editDashModalError.textContent = "Lỗi: Không tìm thấy lịch.";
    return;
  }
  scheduleData[index].type = editDashClassTypeInput.value;
  scheduleData[index].date = editDashScheduleDateInput.value;
  scheduleData[index].time = editDashScheduleTimeInput.value;
  scheduleData[index].name = editDashFullNameInput.value.trim();
  scheduleData[index].email = editDashEmailInput.value.trim();
  scheduleData[index].status = editDashStatusInput.value;
  saveSchedules();
  renderTable();
  updateStatsAndChartData();
  hideEditDashModal();
}
function hideAllModals() {
  hideAdminModal();
  if (editDashModal) editDashModal.style.display = "none";
}

// --- Logic Chính ---
function loadServices() {
  const stored = localStorage.getItem(SERVICE_STORAGE_KEY);
  try {
    allServices = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(allServices)) allServices = [];
  } catch (e) {
    allServices = [];
  }
  updateClassTypeFilter();
}
function updateClassTypeFilter() {
  if (!classTypeFilter) return;
  const currentVal = classTypeFilter.value;
  classTypeFilter.innerHTML = '<option value="">Tất cả</option>';
  allServices.forEach((s) => {
    const o = document.createElement("option");
    o.value = s.name;
    o.textContent = s.name;
    classTypeFilter.appendChild(o);
  });
  if (classTypeFilter.querySelector(`option[value="${currentVal}"]`)) {
    classTypeFilter.value = currentVal;
  } else {
    classTypeFilter.value = "";
  }
}
function updateStatsAndChartData() {
  if (!statsContainer) return;
  const totalPending = scheduleData.filter(
    (s) => s.status === "pending"
  ).length;
  if (pendingCountEl) pendingCountEl.textContent = totalPending;
  const existingServiceStats = statsContainer.querySelectorAll(
    ".stat-box:not(:first-child)"
  );
  existingServiceStats.forEach((box) => box.remove());
  const chartLabels = [];
  const chartData = [];
  const chartBgColors = [
    "#3b82f6",
    "#10b981",
    "#a855f7",
    "#ef4444",
    "#f97316",
    "#8b5cf6",
  ];
  allServices.forEach((service) => {
    const name = service.name;
    const count = scheduleData.filter((s) => s.type === name).length;
    const box = document.createElement("div");
    box.className = "stat-box";
    box.innerHTML = `<p>Tổng số lịch ${escapeHtml(
      name
    )}</p><span>${count}</span>`;
    statsContainer.appendChild(box);
    chartLabels.push(name);
    chartData.push(count);
  });
  renderDynamicClassChart(chartLabels, chartData, chartBgColors);
}

// Render biểu đồ (Phiên bản đầy đủ chức năng đã sửa lỗi cú pháp và biến)
function renderDynamicClassChart(labels, data, bgColors) {
  if (!chartCanvas) {
    console.error("Chart canvas not found!");
    return;
  }
  const ctx = chartCanvas.getContext("2d");
  const hasData = Array.isArray(data) && data.some((c) => c > 0);
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
  const chartContainer = chartCanvas.parentNode;
  const existingMsg = chartContainer
    ? chartContainer.querySelector(".no-chart-data-message")
    : null; // Sửa lỗi biến container
  if (hasData) {
    chartCanvas.style.display = "block";
    if (existingMsg) existingMsg.remove();
    const requiredColors = labels.map((_, i) => bgColors[i % bgColors.length]);
    try {
      chartInstance = new Chart(ctx, {
        type: "bar",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Tổng số lịch",
              data: data,
              backgroundColor: requiredColors,
            },
          ], // Đóng datasets array
        }, // Đóng data object
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: data.length > 1,
            }, // <-- Đảm bảo có dấu phẩy này
            title: {
              display: true,
              text: "Thống kê tổng số lịch theo lớp học",
            },
          }, // <-- Đảm bảo có dấu phẩy này
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        }, // Đóng options object
      }); // Đóng new Chart call
    } catch (chartError) {
      console.error("Chart.js rendering error:", chartError);
      chartCanvas.style.display = "none";
      if (chartContainer && !existingMsg) {
        const p = document.createElement("p");
        p.textContent = "Lỗi khi vẽ biểu đồ.";
        p.className = "no-chart-data-message";
        p.style.cssText = "text-align:center;padding:20px;color:red;";
        chartContainer.appendChild(p);
      }
    }
  } else {
    // No data
    chartCanvas.style.display = "none";
    if (chartContainer && !existingMsg) {
      const p = document.createElement("p");
      p.textContent = "Chưa có dữ liệu biểu đồ.";
      p.className = "no-chart-data-message";
      p.style.cssText =
        "text-align:center;padding:20px;color:#6c757d;font-style:italic;";
      chartContainer.appendChild(p);
    }
  }
}

// Render bảng
function renderTable() {
  if (!scheduleTableBody) return;
  const filterTypeValue = classTypeFilter ? classTypeFilter.value : "";
  const filterEmailValue = emailSearch ? emailSearch.value.toLowerCase() : "";
  const filterDateValue = dateFilter ? dateFilter.value : "";
  const filterStatusValue = statusFilter ? statusFilter.value : "";
  const filteredData = scheduleData.filter((item) => {
    const matchType = !filterTypeValue || item.type === filterTypeValue;
    const matchEmail =
      !filterEmailValue ||
      (item.email && item.email.toLowerCase().includes(filterEmailValue));
    const matchDate = !filterDateValue || item.date === filterDateValue;
    const matchStatus = !filterStatusValue || item.status === filterStatusValue;
    return matchType && matchEmail && matchDate && matchStatus;
  });
  const sortedData = [...filteredData].sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (a.status !== "pending" && b.status === "pending") return 1;
    const dA = a.date ? new Date(a.date) : null;
    const dB = b.date ? new Date(b.date) : null;
    if (dA && dB) return dB - dA;
    if (dA) return -1;
    if (dB) return 1;
    return 0;
  });
  const totalItems = sortedData.length;
  const totalPages = Math.ceil(totalItems / dashboardItemsPerPage);
  if (dashboardCurrentPage > totalPages && totalPages > 0)
    dashboardCurrentPage = totalPages;
  if (dashboardCurrentPage < 1) dashboardCurrentPage = 1;
  const startIndex = (dashboardCurrentPage - 1) * dashboardItemsPerPage;
  const endIndex = startIndex + dashboardItemsPerPage;
  const itemsToDisplay = sortedData.slice(startIndex, endIndex);
  if (itemsToDisplay.length === 0 && dashboardCurrentPage > 1) {
    dashboardCurrentPage--;
    renderTable();
    return;
  }
  // Biểu đồ không vẽ lại ở đây
  if (itemsToDisplay.length > 0) {
    scheduleTableBody.innerHTML = itemsToDisplay
      .map((item) => {
        const statusInfo = getStatusInfo(item.status);
        let actionButtons = "";
        const editButtonHTML = `<button class="btn btn-info btn-sm" onclick="openDashboardEditModal('${item.id}')" title="Sửa lịch này">Sửa</button>`;
        if (item.status === "pending") {
          actionButtons = `${editButtonHTML} <button class="btn-approve btn-sm" onclick="approveSchedule('${item.id}')">Duyệt</button> <button class="btn-cancel btn-sm" onclick="cancelSchedule('${item.id}')">Hủy</button>`;
        } else {
          actionButtons = `${editButtonHTML} <span>${statusInfo.text}</span>`;
        }
        const deleteButtonHTML = `<button class="btn-delete-permanent btn-sm" onclick="confirmPermanentDelete('${item.id}')">Xóa</button>`;
        return `<tr> <td>${escapeHtml(
          item.type || "N/A"
        )}</td> <td>${escapeHtml(item.date || "N/A")}</td> <td>${escapeHtml(
          item.time || "N/A"
        )}</td> <td>${escapeHtml(item.name || "N/A")}</td> <td>${escapeHtml(
          item.email || "N/A"
        )}</td> <td><span class="status-badge ${statusInfo.class}">${
          statusInfo.text
        }</span></td> <td class="action-buttons">${actionButtons}</td> <td>${deleteButtonHTML}</td> </tr>`;
      })
      .join("");
  } else {
    scheduleTableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">Không tìm thấy lịch tập nào phù hợp.</td></tr>`;
    if (dashboardPaginationControls) dashboardPaginationControls.innerHTML = "";
  }
  renderDashboardPaginationControls(totalPages);
}

// Render Pagination Controls
function renderDashboardPaginationControls(totalPages) {
  if (!dashboardPaginationControls || totalPages <= 1) {
    if (dashboardPaginationControls) dashboardPaginationControls.innerHTML = "";
    return;
  }
  dashboardPaginationControls.innerHTML = "";
  const prevLi = document.createElement("li");
  prevLi.className = "page-item";
  if (dashboardCurrentPage === 1) {
    prevLi.classList.add("disabled");
    prevLi.innerHTML = `<span>«</span>`;
  } else {
    prevLi.innerHTML = `<a href="#" data-page="${
      dashboardCurrentPage - 1
    }">«</a>`;
  }
  dashboardPaginationControls.appendChild(prevLi);
  for (let i = 1; i <= totalPages; i++) {
    const pageLi = document.createElement("li");
    pageLi.className = "page-item";
    if (i === dashboardCurrentPage) {
      pageLi.classList.add("active");
      pageLi.innerHTML = `<span>${i}</span>`;
    } else {
      pageLi.innerHTML = `<a href="#" data-page="${i}">${i}</a>`;
    }
    dashboardPaginationControls.appendChild(pageLi);
  }
  const nextLi = document.createElement("li");
  nextLi.className = "page-item";
  if (dashboardCurrentPage === totalPages) {
    nextLi.classList.add("disabled");
    nextLi.innerHTML = `<span>»</span>`;
  } else {
    nextLi.innerHTML = `<a href="#" data-page="${
      dashboardCurrentPage + 1
    }">»</a>`;
  }
  dashboardPaginationControls.appendChild(nextLi);
  dashboardPaginationControls.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const page = parseInt(e.target.dataset.page);
      if (page && page !== dashboardCurrentPage) {
        dashboardCurrentPage = page;
        renderTable();
      }
    });
  });
}

// --- Event Listeners Setup ---
document.addEventListener("DOMContentLoaded", () => {
  console.log("DEBUG: dashboard.js file started loading."); // Log để kiểm tra file load
  try {
    scheduleData = JSON.parse(localStorage.getItem("schedules")) || [];
    loadServices(); // Tải services -> gọi updateClassTypeFilter
    updateStatsAndChartData(); // Tính stats và vẽ chart ban đầu
    dashboardCurrentPage = 1;
    renderTable(); // Render bảng + pagination ban đầu

    function handleFilterChange() {
      dashboardCurrentPage = 1;
      renderTable();
    } // Chỉ render lại bảng
    if (classTypeFilter)
      classTypeFilter.addEventListener("change", handleFilterChange);
    if (emailSearch) emailSearch.addEventListener("input", handleFilterChange);
    if (dateFilter) dateFilter.addEventListener("change", handleFilterChange);
    if (statusFilter)
      statusFilter.addEventListener("change", handleFilterChange);

    if (btnAdminBook)
      btnAdminBook.addEventListener("click", openAdminBookingModal);
    if (adminBookingForm)
      adminBookingForm.addEventListener("submit", handleAdminBookingSubmit);
    adminModalCloseButtons.forEach((button) =>
      button.addEventListener("click", hideAdminModal)
    );

    if (editDashForm)
      editDashForm.addEventListener("submit", handleDashboardEditFormSubmit);
    editDashModalCloseButtons.forEach((button) =>
      button.addEventListener("click", hideEditDashModal)
    );

    window.addEventListener("click", (event) => {
      if (event.target === adminBookingModal) hideAdminModal();
      if (event.target === editDashModal) hideEditDashModal();
    });
    console.log("DEBUG: Initial setup complete."); // Log hoàn tất setup
  } catch (error) {
    console.error("Error during initial setup:", error);
    const main = document.querySelector(".main-content");
    if (main)
      main.innerHTML =
        '<p style="color:red; text-align:center; padding: 20px;">Lỗi tải trang. Kiểm tra Console (F12).</p>';
  }
});
