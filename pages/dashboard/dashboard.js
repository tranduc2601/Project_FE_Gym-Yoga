// --- Khai báo biến và DOM Elements ---
let scheduleData = JSON.parse(localStorage.getItem("schedules")) || [];
let chartInstance = null;
const SERVICE_STORAGE_KEY = 'gymServices';

// DOM Elements cho Bộ lọc và Bảng chính
const classTypeFilter = document.getElementById("classTypeFilter");
const emailSearch = document.getElementById("emailSearch");
const dateFilter = document.getElementById("dateFilter");
const statusFilter = document.getElementById("statusFilter");
const scheduleTableBody = document.getElementById("scheduleTable");
const chartCanvas = document.getElementById("chart");

// DOM Elements cho Thống kê
const gymCountEl = document.getElementById("gymCount");
const yogaCountEl = document.getElementById("yogaCount");
const zumbaCountEl = document.getElementById("zumbaCount");
const pendingCountEl = document.getElementById("pendingCount");
const approvedCountEl = document.getElementById("approvedCount");
const cancelledCountEl = document.getElementById("cancelledCount");

// DOM Elements cho Modal Admin Booking
const adminBookingModal = document.getElementById('admin-schedule-modal');
const adminBookingForm = document.getElementById('admin-schedule-form');
const adminClassTypeInput = document.getElementById('admin-class-type');
const adminScheduleDateInput = document.getElementById('admin-schedule-date');
const adminScheduleTimeInput = document.getElementById('admin-schedule-time');
const adminFullNameInput = document.getElementById('admin-full-name');
const adminEmailInput = document.getElementById('admin-email');
const adminModalError = document.getElementById('admin-modal-error');
const btnAdminBook = document.getElementById('btn-admin-book');
const adminModalCloseButtons = document.querySelectorAll('.admin-modal-close');


// --- Helper Functions ---

function getStatusInfo(status) {
    switch (status) {
        case 'approved': return { text: 'Đã duyệt', class: 'status-approved' };
        case 'cancelled': return { text: 'Đã hủy', class: 'status-cancelled' };
        case 'pending': default: return { text: 'Chờ duyệt', class: 'status-pending' };
    }
}

function saveSchedules() {
    localStorage.setItem("schedules", JSON.stringify(scheduleData));
}

function loadServicesIntoAdminDropdown() {
    const storedServices = localStorage.getItem(SERVICE_STORAGE_KEY);
    let services = [];
    try { services = storedServices ? JSON.parse(storedServices) : []; if (!Array.isArray(services)) services = []; }
    catch(e) { console.error("Error parsing services for admin dropdown:", e); services = []; }
    if (!adminClassTypeInput) return;
    adminClassTypeInput.innerHTML = '<option value="">-- Chọn lớp học --</option>';
    if (services.length > 0) {
        services.forEach(service => { const option = document.createElement('option'); option.value = service.name; option.textContent = service.name; adminClassTypeInput.appendChild(option); });
        adminClassTypeInput.disabled = false;
    } else { adminClassTypeInput.innerHTML = '<option value="">-- Chưa có dịch vụ --</option>'; adminClassTypeInput.disabled = true; }
}

function hideAdminModal() {
    if(adminBookingModal) adminBookingModal.style.display = 'none';
}

function openAdminBookingModal() {
    if (!adminBookingModal || !adminBookingForm || !adminModalError) { console.error("Modal admin booking elements not found!"); return; }
    hideAdminModal(); adminBookingForm.reset(); adminModalError.textContent = '';
    loadServicesIntoAdminDropdown(); adminBookingModal.style.display = 'flex';
}

function validateAdminBookingForm() {
    if (!adminModalError || !adminClassTypeInput || !adminScheduleDateInput || !adminScheduleTimeInput || !adminFullNameInput || !adminEmailInput) { console.error("Thiếu element trong form admin booking"); return false; }
    adminModalError.textContent = '';
    const type = adminClassTypeInput.value, date = adminScheduleDateInput.value, time = adminScheduleTimeInput.value;
    const name = adminFullNameInput.value.trim(), email = adminEmailInput.value.trim();
    if (!type || !date || !time || !name || !email) { adminModalError.textContent = 'Vui lòng điền đầy đủ thông tin.'; return false; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; if (!emailRegex.test(email)) { adminModalError.textContent = 'Định dạng email không hợp lệ.'; return false; }
    const isDuplicate = scheduleData.some(s => s.email.toLowerCase() === email.toLowerCase() && s.date === date && s.time === time && s.type === type && s.status !== 'cancelled');
    if (isDuplicate) { adminModalError.textContent = 'User này đã có lịch tập trùng thời gian và lớp học (đang chờ hoặc đã duyệt).'; return false; }
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(date); selectedDate.setHours(0, 0, 0, 0);
    if (selectedDate < today) { adminModalError.textContent = 'Ngày đặt lịch phải là ngày hiện tại hoặc trong tương lai.'; return false; }
    return true;
}

function handleAdminBookingSubmit(event) {
    event.preventDefault(); if (!validateAdminBookingForm()) return;
    const newSchedule = { id: `sch_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, type: adminClassTypeInput.value, date: adminScheduleDateInput.value, time: adminScheduleTimeInput.value, name: adminFullNameInput.value.trim(), email: adminEmailInput.value.trim(), status: 'approved' };
    scheduleData.push(newSchedule); saveSchedules();
    renderTable(); updateStats(); hideAdminModal();
}

function approveSchedule(id) {
    const index = scheduleData.findIndex(item => item.id === id);
    if (index !== -1 && scheduleData[index].status === 'pending') {
        scheduleData[index].status = 'approved'; saveSchedules(); renderTable(); updateStats();
    } else { alert("Không thể duyệt lịch này (có thể đã được xử lý hoặc không tồn tại)."); }
}

function cancelSchedule(id) {
    const index = scheduleData.findIndex(item => item.id === id);
    if (index !== -1 && scheduleData[index].status === 'pending') {
        if (confirm(`Bạn có chắc chắn muốn hủy lịch tập vào ngày ${scheduleData[index].date} của ${scheduleData[index].name}?`)) {
            scheduleData[index].status = 'cancelled'; saveSchedules(); renderTable(); updateStats();
        }
    } else { alert("Không thể hủy lịch này (có thể đã được xử lý hoặc không tồn tại)."); }
}

// *** HÀM XÓA VĨNH VIỄN ***
function confirmPermanentDelete(id) {
    const scheduleToDelete = scheduleData.find(item => item.id === id);
    if (!scheduleToDelete) { alert("Không tìm thấy lịch để xóa."); return; }
    const confirmationMessage = `Bạn có chắc chắn muốn XÓA VĨNH VIỄN lịch tập:
Lớp: ${scheduleToDelete.type} - Ngày: ${scheduleToDelete.date} - Giờ: ${scheduleToDelete.time}
User: ${scheduleToDelete.name} (${scheduleToDelete.email})
Trạng thái hiện tại: ${getStatusInfo(scheduleToDelete.status).text}

Hành động này không thể hoàn tác!`;
    if (window.confirm(confirmationMessage)) { permanentlyDeleteSchedule(id); }
}
function permanentlyDeleteSchedule(id) {
    const index = scheduleData.findIndex(item => item.id === id);
    if (index !== -1) {
        scheduleData.splice(index, 1); saveSchedules(); renderTable(); updateStats();
        // alert("Đã xóa lịch thành công."); // Optional notification
    } else { alert("Lỗi: Không tìm thấy lịch để xóa."); }
}
// *** KẾT THÚC HÀM XÓA ***


// --- Logic Chính ---

// Cập nhật ô thống kê (Chỉ số liệu tổng)
function updateStats() {
    const totalGym = scheduleData.filter(s => s.type === "Gym").length;
    const totalYoga = scheduleData.filter(s => s.type === "Yoga").length;
    const totalZumba = scheduleData.filter(s => s.type === "Zumba").length;
    const totalPending = scheduleData.filter(s => s.status === "pending").length;
    const totalApproved = scheduleData.filter(s => s.status === "approved").length;
    const totalCancelled = scheduleData.filter(s => s.status === "cancelled").length;
    if(gymCountEl) gymCountEl.textContent = totalGym; if(yogaCountEl) yogaCountEl.textContent = totalYoga; if(zumbaCountEl) zumbaCountEl.textContent = totalZumba;
    if(pendingCountEl) pendingCountEl.textContent = totalPending; if(approvedCountEl) approvedCountEl.textContent = totalApproved; if(cancelledCountEl) cancelledCountEl.textContent = totalCancelled;
}

// Render biểu đồ (Cập nhật theo filter)
function renderClassChart(gymData, yogaData, zumbaData) {
    if (!chartCanvas) return;
    const ctx = chartCanvas.getContext("2d"); const hasData = gymData > 0 || yogaData > 0 || zumbaData > 0;
    if (chartInstance) { chartInstance.destroy(); }
    const chartContainer = chartCanvas.parentNode; const existingMsg = chartContainer.querySelector('.no-chart-data-message');
    if (hasData) {
        chartCanvas.style.display = 'block'; if (existingMsg) existingMsg.remove();
        chartInstance = new Chart(ctx, { type: "bar", data: { labels: ["Gym", "Yoga", "Zumba"], datasets: [{ label: "Số lượng lịch (đã lọc)", data: [gymData, yogaData, zumbaData], backgroundColor: ["#3b82f6", "#10b981", "#a855f7"] }] }, options: { responsive: true, plugins: { legend: { display: false }, title: { display: true, text: 'Thống kê lịch theo lớp học (Kết quả lọc)' } }, scales: { y: { beginAtZero: true } } } });
    } else {
        chartCanvas.style.display = 'none'; if (!existingMsg) { const noDataMessage = document.createElement('p'); noDataMessage.textContent = "Không có dữ liệu phù hợp để hiển thị biểu đồ."; noDataMessage.className = 'no-chart-data-message'; noDataMessage.style.textAlign = 'center'; noDataMessage.style.padding = '20px'; noDataMessage.style.color = '#6c757d'; chartContainer.appendChild(noDataMessage); }
    }
}

// Render bảng (Cập nhật theo filter, vẽ biểu đồ, thêm nút xóa)
function renderTable() {
    if (!scheduleTableBody) return;
    const filterTypeValue = classTypeFilter ? classTypeFilter.value : "";
    const filterEmailValue = emailSearch ? emailSearch.value.toLowerCase() : "";
    const filterDateValue = dateFilter ? dateFilter.value : "";
    const filterStatusValue = statusFilter ? statusFilter.value : "";
    // Lọc từ TOÀN BỘ scheduleData
    const filteredData = scheduleData.filter(item => { const matchType = !filterTypeValue || item.type === filterTypeValue; const matchEmail = !filterEmailValue || (item.email && item.email.toLowerCase().includes(filterEmailValue)); const matchDate = !filterDateValue || item.date === filterDateValue; const matchStatus = !filterStatusValue || item.status === filterStatusValue; return matchType && matchEmail && matchDate && matchStatus; });
    // Sắp xếp
    const sortedData = [...filteredData].sort((a, b) => { if (a.status === 'pending' && b.status !== 'pending') return -1; if (a.status !== 'pending' && b.status === 'pending') return 1; const dateA = a.date ? new Date(a.date) : null; const dateB = b.date ? new Date(b.date) : null; if (dateA && dateB) return dateB - dateA; if (dateA) return -1; if (dateB) return 1; return 0; });

    // Tính số liệu và vẽ biểu đồ từ dữ liệu ĐÃ LỌC
    const filteredGym = sortedData.filter(s => s.type === "Gym").length; const filteredYoga = sortedData.filter(s => s.type === "Yoga").length; const filteredZumba = sortedData.filter(s => s.type === "Zumba").length;
    renderClassChart(filteredGym, filteredYoga, filteredZumba);

    // Tạo HTML cho bảng
    if (sortedData.length > 0) {
        scheduleTableBody.innerHTML = sortedData.map(item => {
            const statusInfo = getStatusInfo(item.status); let actionButtons = '';
            if (item.status === 'pending') { actionButtons = `<button class="btn-approve" onclick="approveSchedule('${item.id}')" title="Duyệt lịch này">Duyệt</button> <button class="btn-cancel" onclick="cancelSchedule('${item.id}')" title="Hủy lịch này">Hủy</button>`; }
             else { actionButtons = `<span>${statusInfo.text}</span>`; }
            // Thêm nút xóa vĩnh viễn
            const deleteButtonHTML = `<button class="btn-delete-permanent" onclick="confirmPermanentDelete('${item.id}')" title="Xóa vĩnh viễn lịch này">Xóa</button>`;
            return `<tr> <td>${item.type || 'N/A'}</td> <td>${item.date || 'N/A'}</td> <td>${item.time || 'N/A'}</td> <td>${item.name || 'N/A'}</td> <td>${item.email || 'N/A'}</td> <td><span class="status-badge ${statusInfo.class}">${statusInfo.text}</span></td> <td class="action-buttons">${actionButtons}</td> <td>${deleteButtonHTML}</td> </tr>`; // Thêm ô cho nút xóa
        }).join("");
    } else { scheduleTableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">Không tìm thấy lịch tập nào phù hợp.</td></tr>`; } // Colspan = 8
}

// --- Event Listeners Setup ---
document.addEventListener('DOMContentLoaded', () => {
    if(classTypeFilter) classTypeFilter.addEventListener('change', renderTable);
    if(emailSearch) emailSearch.addEventListener('input', renderTable);
    if(dateFilter) dateFilter.addEventListener('change', renderTable);
    if(statusFilter) statusFilter.addEventListener('change', renderTable);
    if(btnAdminBook) btnAdminBook.addEventListener('click', openAdminBookingModal);
    if(adminBookingForm) adminBookingForm.addEventListener('submit', handleAdminBookingSubmit);
    adminModalCloseButtons.forEach(button => button.addEventListener('click', hideAdminModal));
    window.addEventListener('click', (event) => { if (event.target === adminBookingModal) hideAdminModal(); });
    // Initial Load
    updateStats(); renderTable();
});