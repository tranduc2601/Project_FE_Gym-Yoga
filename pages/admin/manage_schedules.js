document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const scheduleTableBody = document.getElementById('manage-schedule-list-body');
    // *** SỬA LẠI ID CHO ĐÚNG VỚI HTML ***
    const paginationControls = document.getElementById('manage-pagination-controls');
    // Modal sửa
    const editModal = document.getElementById('edit-schedule-modal');
    const editForm = document.getElementById('edit-schedule-form');
    const editScheduleIdInput = document.getElementById('edit-schedule-id');
    const editClassTypeInput = document.getElementById('edit-class-type');
    const editScheduleDateInput = document.getElementById('edit-schedule-date');
    const editScheduleTimeInput = document.getElementById('edit-schedule-time');
    const editFullNameInput = document.getElementById('edit-full-name');
    const editEmailInput = document.getElementById('edit-email');
    const editScheduleNoteInput = document.getElementById('edit-schedule-note');
    const editModalError = document.getElementById('edit-modal-error');
    const editModalCloseButtons = document.querySelectorAll('.edit-modal-close');
    // Modal ghi chú
    const noteModal = document.getElementById('note-modal');
    const noteForm = document.getElementById('note-form');
    const noteScheduleIdInput = document.getElementById('note-schedule-id');
    const scheduleNoteInput = document.getElementById('schedule-note-input');
    const noteModalCloseButtons = document.querySelectorAll('.note-modal-close');

    // --- Data & State ---
    let allSchedules = [];
    let currentScheduleToEdit = null;
    let currentScheduleToAddNote = null;
    let currentPage = 1;
    const itemsPerPage = 5;
    const SCHEDULE_STORAGE_KEY = 'schedules';
    const SERVICE_STORAGE_KEY = 'gymServices';

    // --- Functions ---
    function loadSchedules() {
        const storedSchedules = localStorage.getItem(SCHEDULE_STORAGE_KEY);
        try { allSchedules = storedSchedules ? JSON.parse(storedSchedules) : []; if (!Array.isArray(allSchedules)) allSchedules = []; }
        catch(e) { console.error("Error parsing schedules:", e); allSchedules = []; }
        let needsSave = false;
        allSchedules.forEach((schedule, index) => {
            if (!schedule.id) { schedule.id = `sch_${Date.now()}_${index}_${Math.random().toString(36).substr(2,3)}`; needsSave = true; }
            if (!schedule.status) { schedule.status = 'pending'; needsSave = true; }
            if (schedule.note === undefined) { schedule.note = ''; needsSave = true; }
        });
       if(needsSave) saveSchedules();
    }
    function saveSchedules() { localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(allSchedules)); }

    function loadServicesAndTimesIntoEditDropdown() {
        const storedServices = localStorage.getItem(SERVICE_STORAGE_KEY);
        let services = [];
        try { services = storedServices ? JSON.parse(storedServices) : []; if (!Array.isArray(services)) services = []; }
        catch(e) { services = []; }
        if (!editClassTypeInput) return;
        editClassTypeInput.innerHTML = '<option value="">-- Chọn lớp --</option>';
        if (services.length > 0) {
            services.forEach(service => { const option = document.createElement('option'); option.value = service.name; option.textContent = service.name; editClassTypeInput.appendChild(option); });
            editClassTypeInput.disabled = false;
        } else { editClassTypeInput.disabled = true; }
        const timeOptions = ["06:00 - 07:00", "07:00 - 08:00", "08:00 - 09:00", "17:00 - 18:00", "18:00 - 19:00", "19:00 - 20:00"];
        editScheduleTimeInput.innerHTML = '<option value="">-- Chọn giờ --</option>';
        timeOptions.forEach(time => { const option = document.createElement('option'); option.value = time; option.textContent = time; editScheduleTimeInput.appendChild(option); });
    }

    function getStatusInfo(status) { switch (status) { case 'approved': return { text: 'Đã duyệt', class: 'status-approved' }; case 'cancelled': return { text: 'Đã hủy', class: 'status-cancelled' }; case 'pending': default: return { text: 'Chờ duyệt', class: 'status-pending' }; } }

    // *** THÊM HÀM escapeHtml ***
    function escapeHtml(unsafe = '') {
        // Đảm bảo đầu vào là string
        const str = String(unsafe);
        return str
             .replace(/&/g, "&")
             .replace(/</g, "<")
             .replace(/>/g, ">")
             .replace(/"/g, "")
             .replace(/'/g, "'");
     }

    function renderTable() {
        if (!scheduleTableBody) return; scheduleTableBody.innerHTML = '';
        const dataToRender = allSchedules;
        const totalItems = dataToRender.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;
        const startIndex = (currentPage - 1) * itemsPerPage; const endIndex = startIndex + itemsPerPage;
        const sortedSchedules = [...dataToRender].sort((a, b) => { if (a.status === 'pending' && b.status !== 'pending') return -1; if (a.status !== 'pending' && b.status === 'pending') return 1; const dateA = a.date ? new Date(a.date) : null; const dateB = b.date ? new Date(b.date) : null; if (dateA && dateB) return dateB - dateA; if (dateA) return -1; if (dateB) return 1; return 0; });
        const itemsToDisplay = sortedSchedules.slice(startIndex, endIndex);

        if (itemsToDisplay.length === 0 && currentPage > 1) { currentPage--; renderTable(); return; }

        if (itemsToDisplay.length > 0) {
            scheduleTableBody.innerHTML = itemsToDisplay.map(item => {
                const statusInfo = getStatusInfo(item.status);
                const noteText = item.note || '';
                // Gọi hàm escapeHtml đã thêm
                const noteDisplay = noteText ? escapeHtml(noteText.substring(0, 30) + (noteText.length > 30 ? '...' : '')) : '<i>(chưa có)</i>';
                const cancelButtonHTML = `<button class="btn btn-warning btn-sm" onclick="adminCancelSchedule('${item.id}')" title="Đổi trạng thái thành Đã Hủy">Hủy</button>`;

                return `
                    <tr>
                        <td>${item.type || 'N/A'}</td>
                        <td>${item.date || 'N/A'}</td>
                        <td>${item.time || 'N/A'}</td>
                        <td>${escapeHtml(item.name || 'N/A')}</td> <td>${escapeHtml(item.email || 'N/A')}</td>
                        <td><span class="status-badge ${statusInfo.class}">${statusInfo.text}</span></td>
                        <td title="${escapeHtml(noteText)}">${noteDisplay}</td>
                        <td class="action-buttons-manage">
                            <button class="btn btn-info btn-sm" onclick="openEditModal('${item.id}')" title="Sửa lịch này">Sửa</button>
                            ${cancelButtonHTML}
                            <button class="btn btn-secondary btn-sm" onclick="openNoteModal('${item.id}')" title="Thêm/Sửa ghi chú">Ghi chú</button>
                        </td>
                        <td>
                            <button class="btn btn-danger btn-sm" onclick="confirmAdminDelete('${item.id}')" title="Xóa vĩnh viễn">Xóa</button>
                        </td>
                    </tr>
                `;
            }).join("");
        } else { scheduleTableBody.innerHTML = `<tr><td colspan="9" style="text-align:center;">Không có lịch tập nào.</td></tr>`; }

        renderPaginationControls(totalPages);
    }

    function renderPaginationControls(totalPages) {
        // *** Sử dụng biến paginationControls đã được lấy đúng ID ở trên ***
        if (!paginationControls || totalPages <= 1) { if(paginationControls) paginationControls.innerHTML = ''; return; }
        paginationControls.innerHTML = '';
        const prevLi = document.createElement('li'); prevLi.className = 'page-item'; if (currentPage === 1) { prevLi.classList.add('disabled'); prevLi.innerHTML = `<span>«</span>`; } else { prevLi.innerHTML = `<a href="#" data-page="${currentPage - 1}">«</a>`; } paginationControls.appendChild(prevLi);
        for (let i = 1; i <= totalPages; i++) { const pageLi = document.createElement('li'); pageLi.className = 'page-item'; if (i === currentPage) { pageLi.classList.add('active'); pageLi.innerHTML = `<span>${i}</span>`; } else { pageLi.innerHTML = `<a href="#" data-page="${i}">${i}</a>`; } paginationControls.appendChild(pageLi); }
        const nextLi = document.createElement('li'); nextLi.className = 'page-item'; if (currentPage === totalPages) { nextLi.classList.add('disabled'); nextLi.innerHTML = `<span>»</span>`; } else { nextLi.innerHTML = `<a href="#" data-page="${currentPage + 1}">»</a>`; } paginationControls.appendChild(nextLi);
        paginationControls.querySelectorAll('a').forEach(link => { link.addEventListener('click', (e) => { e.preventDefault(); const page = parseInt(e.target.dataset.page); if (page && page !== currentPage) { currentPage = page; renderTable(); } }); });
    }

    // --- Admin Action Functions ---
    function openEditModal(id) {
        currentScheduleToEdit = allSchedules.find(s => s.id === id);
        if (!currentScheduleToEdit || !editModal || !editForm) return;
        hideAllModals(); editForm.reset(); editModalError.textContent = '';
        loadServicesAndTimesIntoEditDropdown();
        editScheduleIdInput.value = currentScheduleToEdit.id;
        setTimeout(() => { editClassTypeInput.value = currentScheduleToEdit.type; editScheduleTimeInput.value = currentScheduleToEdit.time; }, 0);
        editScheduleDateInput.value = currentScheduleToEdit.date; editFullNameInput.value = currentScheduleToEdit.name; editEmailInput.value = currentScheduleToEdit.email; editScheduleNoteInput.value = currentScheduleToEdit.note || '';
        editModal.style.display = 'flex';
    }
    function handleEditFormSubmit(event) {
        event.preventDefault(); if (!currentScheduleToEdit) return;
        // Basic validation (can be enhanced)
         if (!editClassTypeInput.value || !editScheduleDateInput.value || !editScheduleTimeInput.value || !editFullNameInput.value.trim() || !editEmailInput.value.trim()) {
              editModalError.textContent = 'Vui lòng điền đầy đủ thông tin bắt buộc.'; return;
         }
         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
         if (!emailRegex.test(editEmailInput.value.trim())) {
              editModalError.textContent = 'Định dạng email không hợp lệ.'; return;
         }
         editModalError.textContent = ''; // Clear error

        const id = editScheduleIdInput.value; const index = allSchedules.findIndex(s => s.id === id); if (index === -1) { editModalError.textContent = 'Lỗi: Không tìm thấy lịch.'; return; }
        allSchedules[index].type = editClassTypeInput.value; allSchedules[index].date = editScheduleDateInput.value; allSchedules[index].time = editScheduleTimeInput.value; allSchedules[index].name = editFullNameInput.value.trim(); allSchedules[index].email = editEmailInput.value.trim(); allSchedules[index].note = editScheduleNoteInput.value.trim();
        saveSchedules(); renderTable(); hideAllModals();
        // alert('Đã cập nhật lịch tập.'); // Consider using a temporary success message div instead of alert
    }
    function adminCancelSchedule(id) {
         const index = allSchedules.findIndex(item => item.id === id);
         if (index !== -1 && allSchedules[index].status !== 'cancelled') {
              if (confirm(`Admin: Chuyển lịch ngày ${allSchedules[index].date} của ${allSchedules[index].name} thành "Đã hủy"?`)) { allSchedules[index].status = 'cancelled'; saveSchedules(); renderTable(); }
         } else if (index !== -1) { alert("Lịch này đã ở trạng thái hủy."); }
         else { alert("Không tìm thấy lịch."); }
    }
     function openNoteModal(id) {
         currentScheduleToAddNote = allSchedules.find(s => s.id === id); if (!currentScheduleToAddNote || !noteModal || !noteForm) return;
         hideAllModals(); noteForm.reset(); noteScheduleIdInput.value = currentScheduleToAddNote.id; scheduleNoteInput.value = currentScheduleToAddNote.note || '';
         noteModal.style.display = 'flex';
     }
     function handleNoteFormSubmit(event) {
         event.preventDefault(); if (!currentScheduleToAddNote) return;
         const index = allSchedules.findIndex(s => s.id === currentScheduleToAddNote.id);
         if (index !== -1) { allSchedules[index].note = scheduleNoteInput.value.trim(); saveSchedules(); renderTable(); hideAllModals(); }
         else { alert("Lỗi: Không tìm thấy lịch."); }
     }
    function confirmAdminDelete(id) { const s = allSchedules.find(item => item.id === id); if (!s) { alert("Không tìm thấy lịch."); return; } if (window.confirm(`XÓA VĨNH VIỄN lịch ${s.type} - ${s.date} của ${s.name}?`)) { permanentlyDeleteSchedule(id); } }
    function permanentlyDeleteSchedule(id){ const index = allSchedules.findIndex(item => item.id === id); if (index !== -1) { allSchedules.splice(index, 1); saveSchedules(); currentPage = 1; renderTable(); /* updateStats(); if applicable */ } else { alert("Lỗi: Không tìm thấy lịch."); } }
    function hideAllModals() { if(editModal) editModal.style.display = 'none'; if(noteModal) noteModal.style.display = 'none'; }

    // --- Event Listeners ---
    document.addEventListener('DOMContentLoaded', () => {
        loadSchedules(); renderTable();
        if(editForm) editForm.addEventListener('submit', handleEditFormSubmit);
        editModalCloseButtons.forEach(button => button.addEventListener('click', hideAllModals));
        if(noteForm) noteForm.addEventListener('submit', handleNoteFormSubmit);
        noteModalCloseButtons.forEach(button => button.addEventListener('click', hideAllModals));
        window.addEventListener('click', (event) => { if (event.target === editModal || event.target === noteModal) { hideAllModals(); } });
    });
});