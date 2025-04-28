// --- Khai báo biến và DOM Elements ---
let scheduleData = JSON.parse(localStorage.getItem("schedules")) || [];
let chartInstance = null;
const SERVICE_STORAGE_KEY = 'gymServices';
let dashboardCurrentPage = 1; // Trang hiện tại của bảng dashboard
const dashboardItemsPerPage = 5; // Số mục mỗi trang dashboard

// DOM Elements
const classTypeFilter = document.getElementById("classTypeFilter");
const emailSearch = document.getElementById("emailSearch");
const dateFilter = document.getElementById("dateFilter");
const statusFilter = document.getElementById("statusFilter");
const scheduleTableBody = document.getElementById("scheduleTable");
const chartCanvas = document.getElementById("chart");
const gymCountEl = document.getElementById("gymCount");
const yogaCountEl = document.getElementById("yogaCount");
const zumbaCountEl = document.getElementById("zumbaCount");
const pendingCountEl = document.getElementById("pendingCount");
const approvedCountEl = document.getElementById("approvedCount");
const cancelledCountEl = document.getElementById("cancelledCount");
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
const dashboardPaginationControls = document.getElementById("dashboard-pagination-controls");

// --- Helper Functions ---
function getStatusInfo(status) { switch (status) { case 'approved': return { text: 'Đã duyệt', class: 'status-approved' }; case 'cancelled': return { text: 'Đã hủy', class: 'status-cancelled' }; case 'pending': default: return { text: 'Chờ duyệt', class: 'status-pending' }; } }
function saveSchedules() { localStorage.setItem("schedules", JSON.stringify(scheduleData)); }
function loadServicesIntoAdminDropdown() { const storedServices = localStorage.getItem(SERVICE_STORAGE_KEY); let services = []; try { services = storedServices ? JSON.parse(storedServices) : []; if (!Array.isArray(services)) services = []; } catch(e) { console.error("Error parsing services:", e); services = []; } if (!adminClassTypeInput) return; adminClassTypeInput.innerHTML = '<option value="">-- Chọn lớp học --</option>'; if (services.length > 0) { services.forEach(service => { const option = document.createElement('option'); option.value = service.name; option.textContent = service.name; adminClassTypeInput.appendChild(option); }); adminClassTypeInput.disabled = false; } else { adminClassTypeInput.innerHTML = '<option value="">-- Chưa có dịch vụ --</option>'; adminClassTypeInput.disabled = true; } }
function hideAdminModal() { if(adminBookingModal) adminBookingModal.style.display = 'none'; }
function openAdminBookingModal() { if (!adminBookingModal || !adminBookingForm || !adminModalError) return; hideAdminModal(); adminBookingForm.reset(); adminModalError.textContent = ''; loadServicesIntoAdminDropdown(); adminBookingModal.style.display = 'flex'; }
function validateAdminBookingForm() { if (!adminModalError || !adminClassTypeInput || !adminScheduleDateInput || !adminScheduleTimeInput || !adminFullNameInput || !adminEmailInput) return false; adminModalError.textContent = ''; const type = adminClassTypeInput.value, date = adminScheduleDateInput.value, time = adminScheduleTimeInput.value, name = adminFullNameInput.value.trim(), email = adminEmailInput.value.trim(); if (!type || !date || !time || !name || !email) { adminModalError.textContent = 'Vui lòng điền đầy đủ thông tin.'; return false; } const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; if (!emailRegex.test(email)) { adminModalError.textContent = 'Định dạng email không hợp lệ.'; return false; } const isDuplicate = scheduleData.some(s => s.email.toLowerCase() === email.toLowerCase() && s.date === date && s.time === time && s.type === type && s.status !== 'cancelled'); if (isDuplicate) { adminModalError.textContent = 'User này đã có lịch tập trùng.'; return false; } const today = new Date(); today.setHours(0, 0, 0, 0); const selectedDate = new Date(date); selectedDate.setHours(0, 0, 0, 0); if (selectedDate < today) { adminModalError.textContent = 'Ngày đặt lịch phải là quá khứ hoặc hiện tại.'; return false; } return true; }
function handleAdminBookingSubmit(event) { event.preventDefault(); if (!validateAdminBookingForm()) return; const newSchedule = { id: `sch_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, type: adminClassTypeInput.value, date: adminScheduleDateInput.value, time: adminScheduleTimeInput.value, name: adminFullNameInput.value.trim(), email: adminEmailInput.value.trim(), status: 'approved' }; scheduleData.push(newSchedule); saveSchedules(); renderTable(); updateStats(); hideAdminModal(); }
function approveSchedule(id) { const index = scheduleData.findIndex(item => item.id === id); if (index !== -1 && scheduleData[index].status === 'pending') { scheduleData[index].status = 'approved'; saveSchedules(); renderTable(); updateStats(); } else { alert("Không thể duyệt."); } }
function cancelSchedule(id) { const index = scheduleData.findIndex(item => item.id === id); if (index !== -1 && scheduleData[index].status === 'pending') { if (confirm(`Hủy lịch ${scheduleData[index].date} của ${scheduleData[index].name}?`)) { scheduleData[index].status = 'cancelled'; saveSchedules(); renderTable(); updateStats(); } } else { alert("Không thể hủy."); } }
function confirmPermanentDelete(id) { const s = scheduleData.find(item => item.id === id); if (!s) { alert("Không tìm thấy lịch."); return; } if (window.confirm(`XÓA VĨNH VIỄN lịch ${s.type} - ${s.date} của ${s.name}? \nKhông thể hoàn tác!`)) { permanentlyDeleteSchedule(id); } }
function permanentlyDeleteSchedule(id) { const index = scheduleData.findIndex(item => item.id === id); if (index !== -1) { scheduleData.splice(index, 1); saveSchedules(); renderTable(); updateStats(); } else { alert("Lỗi: Không tìm thấy lịch để xóa."); } }

// --- Core Logic ---
function updateStats() { const totalGym = scheduleData.filter(s => s.type === "Gym").length; const totalYoga = scheduleData.filter(s => s.type === "Yoga").length; const totalZumba = scheduleData.filter(s => s.type === "Zumba").length; const totalPending = scheduleData.filter(s => s.status === "pending").length; const totalApproved = scheduleData.filter(s => s.status === "approved").length; const totalCancelled = scheduleData.filter(s => s.status === "cancelled").length; if(gymCountEl) gymCountEl.textContent = totalGym; if(yogaCountEl) yogaCountEl.textContent = totalYoga; if(zumbaCountEl) zumbaCountEl.textContent = totalZumba; if(pendingCountEl) pendingCountEl.textContent = totalPending; if(approvedCountEl) approvedCountEl.textContent = totalApproved; if(cancelledCountEl) cancelledCountEl.textContent = totalCancelled; }
function renderClassChart(gymData, yogaData, zumbaData) { if (!chartCanvas) return; const ctx = chartCanvas.getContext("2d"); const hasData = gymData > 0 || yogaData > 0 || zumbaData > 0; if (chartInstance) { chartInstance.destroy(); } const chartContainer = chartCanvas.parentNode; const existingMsg = chartContainer.querySelector('.no-chart-data-message'); if (hasData) { chartCanvas.style.display = 'block'; if (existingMsg) existingMsg.remove(); chartInstance = new Chart(ctx, { type: "bar", data: { labels: ["Gym", "Yoga", "Zumba"], datasets: [{ label: "Số lượng lịch (đã lọc)", data: [gymData, yogaData, zumbaData], backgroundColor: ["#3b82f6", "#10b981", "#a855f7"] }] }, options: { responsive: true, plugins: { legend: { display: false }, title: { display: true, text: 'Thống kê lịch theo lớp học (Kết quả lọc)' } }, scales: { y: { beginAtZero: true } } } }); } else { chartCanvas.style.display = 'none'; if (!existingMsg) { const msg = document.createElement('p'); msg.textContent = "Không có dữ liệu phù hợp."; msg.className = 'no-chart-data-message'; msg.style.textAlign = 'center'; msg.style.padding = '20px'; msg.style.color = '#6c757d'; chartContainer.appendChild(msg); } } }
function renderDashboardPaginationControls(totalPages) { if (!dashboardPaginationControls || totalPages <= 1) { if(dashboardPaginationControls) dashboardPaginationControls.innerHTML = ''; return; } dashboardPaginationControls.innerHTML = ''; const prevLi = document.createElement('li'); prevLi.className = 'page-item'; if (dashboardCurrentPage === 1) { prevLi.classList.add('disabled'); prevLi.innerHTML = `<span>«</span>`; } else { prevLi.innerHTML = `<a href="#" data-page="${dashboardCurrentPage - 1}">«</a>`; } dashboardPaginationControls.appendChild(prevLi); for (let i = 1; i <= totalPages; i++) { const pageLi = document.createElement('li'); pageLi.className = 'page-item'; if (i === dashboardCurrentPage) { pageLi.classList.add('active'); pageLi.innerHTML = `<span>${i}</span>`; } else { pageLi.innerHTML = `<a href="#" data-page="${i}">${i}</a>`; } dashboardPaginationControls.appendChild(pageLi); } const nextLi = document.createElement('li'); nextLi.className = 'page-item'; if (dashboardCurrentPage === totalPages) { nextLi.classList.add('disabled'); nextLi.innerHTML = `<span>»</span>`; } else { nextLi.innerHTML = `<a href="#" data-page="${dashboardCurrentPage + 1}">»</a>`; } dashboardPaginationControls.appendChild(nextLi); dashboardPaginationControls.querySelectorAll('a').forEach(link => { link.addEventListener('click', (e) => { e.preventDefault(); const page = parseInt(e.target.dataset.page); if (page && page !== dashboardCurrentPage) { dashboardCurrentPage = page; renderTable(); } }); }); }
function renderTable() {
    if (!scheduleTableBody) return;
    const filterTypeValue = classTypeFilter ? classTypeFilter.value : ""; const filterEmailValue = emailSearch ? emailSearch.value.toLowerCase() : ""; const filterDateValue = dateFilter ? dateFilter.value : ""; const filterStatusValue = statusFilter ? statusFilter.value : "";
    const filteredData = scheduleData.filter(item => { const matchType = !filterTypeValue || item.type === filterTypeValue; const matchEmail = !filterEmailValue || (item.email && item.email.toLowerCase().includes(filterEmailValue)); const matchDate = !filterDateValue || item.date === filterDateValue; const matchStatus = !filterStatusValue || item.status === filterStatusValue; return matchType && matchEmail && matchDate && matchStatus; });
    const sortedData = [...filteredData].sort((a, b) => { if (a.status === 'pending' && b.status !== 'pending') return -1; if (a.status !== 'pending' && b.status === 'pending') return 1; const dateA = a.date ? new Date(a.date) : null; const dateB = b.date ? new Date(b.date) : null; if (dateA && dateB) return dateB - dateA; if (dateA) return -1; if (dateB) return 1; return 0; });
    const totalItems = sortedData.length; const totalPages = Math.ceil(totalItems / dashboardItemsPerPage);
    if (dashboardCurrentPage > totalPages && totalPages > 0) { dashboardCurrentPage = totalPages; } if (dashboardCurrentPage < 1) { dashboardCurrentPage = 1; }
    const startIndex = (dashboardCurrentPage - 1) * dashboardItemsPerPage; const endIndex = startIndex + dashboardItemsPerPage; const itemsToDisplay = sortedData.slice(startIndex, endIndex);
    if (itemsToDisplay.length === 0 && dashboardCurrentPage > 1) { dashboardCurrentPage--; renderTable(); return; }
    const filteredGym = filteredData.filter(s => s.type === "Gym").length; const filteredYoga = filteredData.filter(s => s.type === "Yoga").length; const filteredZumba = filteredData.filter(s => s.type === "Zumba").length; renderClassChart(filteredGym, filteredYoga, filteredZumba);
    if (itemsToDisplay.length > 0) {
        scheduleTableBody.innerHTML = itemsToDisplay.map(item => { const statusInfo = getStatusInfo(item.status); let actionButtons = ''; if (item.status === 'pending') { actionButtons = `<button class="btn-approve" onclick="approveSchedule('${item.id}')">Duyệt</button> <button class="btn-cancel" onclick="cancelSchedule('${item.id}')">Hủy</button>`; } else { actionButtons = `<span>${statusInfo.text}</span>`; } const deleteButtonHTML = `<button class="btn-delete-permanent" onclick="confirmPermanentDelete('${item.id}')">Xóa</button>`; return `<tr> <td>${item.type||'N/A'}</td> <td>${item.date||'N/A'}</td> <td>${item.time||'N/A'}</td> <td>${item.name||'N/A'}</td> <td>${item.email||'N/A'}</td> <td><span class="status-badge ${statusInfo.class}">${statusInfo.text}</span></td> <td class="action-buttons">${actionButtons}</td> <td>${deleteButtonHTML}</td> </tr>`; }).join("");
    } else { scheduleTableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">Không tìm thấy lịch tập nào phù hợp.</td></tr>`; if (dashboardPaginationControls) dashboardPaginationControls.innerHTML = ''; }
    renderDashboardPaginationControls(totalPages);
}

// --- Event Listeners Setup ---
document.addEventListener('DOMContentLoaded', () => {
    function handleFilterChange() { dashboardCurrentPage = 1; renderTable(); }
    if(classTypeFilter) classTypeFilter.addEventListener('change', handleFilterChange); if(emailSearch) emailSearch.addEventListener('input', handleFilterChange); if(dateFilter) dateFilter.addEventListener('change', handleFilterChange); if(statusFilter) statusFilter.addEventListener('change', handleFilterChange);
    if(btnAdminBook) btnAdminBook.addEventListener('click', openAdminBookingModal); if(adminBookingForm) adminBookingForm.addEventListener('submit', handleAdminBookingSubmit); adminModalCloseButtons.forEach(button => button.addEventListener('click', hideAdminModal)); window.addEventListener('click', (event) => { if (event.target === adminBookingModal) hideAdminModal(); });
    updateStats(); dashboardCurrentPage = 1; renderTable();
});