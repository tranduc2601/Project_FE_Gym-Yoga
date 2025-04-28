document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const scheduleTableBody = document.getElementById('schedule-list-body');
    const paginationControls = document.getElementById('pagination-controls');
    const btnAddNew = document.getElementById('btn-add-new');
    const modal = document.getElementById('schedule-modal');
    const modalTitle = document.getElementById('modal-title');
    const scheduleForm = document.getElementById('schedule-form');
    const scheduleIdInput = document.getElementById('schedule-id');
    const classTypeInput = document.getElementById('class-type');
    const scheduleDateInput = document.getElementById('schedule-date');
    const scheduleTimeInput = document.getElementById('schedule-time');
    const fullNameInput = document.getElementById('full-name');
    const emailInput = document.getElementById('email');
    const modalError = document.getElementById('modal-error');
    const closeButtons = document.querySelectorAll('.modal .close-button'); // All close buttons (span)

    const deleteModal = document.getElementById('delete-confirm-modal');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');

    // --- Data ---
    let schedules = [];
    let currentScheduleIdToDelete = null;
    let currentScheduleToEdit = null;
    let currentPage = 1;
    const itemsPerPage = 5;
    const SCHEDULE_STORAGE_KEY = 'schedules';
    const SERVICE_STORAGE_KEY = 'gymServices';
    const USER_STORAGE_KEY = 'currentUser'; // Key for logged in user

    // --- Functions ---
    function loadSchedules() {
        const storedSchedules = localStorage.getItem(SCHEDULE_STORAGE_KEY);
        try { schedules = storedSchedules ? JSON.parse(storedSchedules) : []; if (!Array.isArray(schedules)) schedules = []; }
        catch(e) { console.error("Error parsing schedules:", e); schedules = []; }
        let needsSave = false;
        schedules.forEach((schedule, index) => {
            if (!schedule.id) { schedule.id = `sch_${Date.now()}_${index}_${Math.random().toString(36).substr(2,3)}`; needsSave = true; }
            if (!schedule.status) { schedule.status = 'pending'; needsSave = true; }
        });
       if(needsSave) saveSchedules();
    }
    function saveSchedules() { localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(schedules)); }
    function loadServicesIntoDropdown() {
        const storedServices = localStorage.getItem(SERVICE_STORAGE_KEY);
        let services = [];
        try { services = storedServices ? JSON.parse(storedServices) : []; if (!Array.isArray(services)) services = []; }
        catch(e) { console.error("Error parsing services for dropdown:", e); services = []; }
        if (!classTypeInput) return;
        classTypeInput.innerHTML = '<option value="">-- Chọn lớp học --</option>';
        if (services.length > 0) {
            services.forEach(service => { const option = document.createElement('option'); option.value = service.name; option.textContent = service.name; classTypeInput.appendChild(option); });
            classTypeInput.disabled = false;
        } else { classTypeInput.innerHTML = '<option value="">-- Chưa có dịch vụ --</option>'; classTypeInput.disabled = true; }
    }
    function validateForm() {
        if (!modalError || !classTypeInput || !scheduleDateInput || !scheduleTimeInput || !fullNameInput || !emailInput) return false;
        modalError.textContent = ''; const type = classTypeInput.value, date = scheduleDateInput.value, time = scheduleTimeInput.value, name = fullNameInput.value.trim(), email = emailInput.value.trim(), id = scheduleIdInput.value;
        if (!type || !date || !time || !name || !email) { modalError.textContent = 'Vui lòng điền đầy đủ thông tin.'; return false; }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; if (!emailRegex.test(email)) { modalError.textContent = 'Định dạng email không hợp lệ.'; return false; }
        const isDuplicate = schedules.some(s => s.email.toLowerCase() === email.toLowerCase() && s.date === date && s.time === time && s.type === type && s.id !== id && s.status !== 'cancelled');
        if (isDuplicate) { modalError.textContent = 'Lịch tập này đang chờ duyệt hoặc đã được duyệt.'; return false; }
        const today = new Date(); today.setHours(0,0,0,0);
        const selectedDate = new Date(date); selectedDate.setMinutes(selectedDate.getMinutes() + selectedDate.getTimezoneOffset()); selectedDate.setHours(0,0,0,0);
        if (selectedDate < today) { modalError.textContent = 'Ngày đặt lịch phải là ngày hiện tại hoặc trong tương lai.'; return false; }
        return true;
    }
    function getStatusInfo(status) { switch (status) { case 'approved': return { text: 'Đã duyệt', class: 'status-approved' }; case 'cancelled': return { text: 'Đã hủy', class: 'status-cancelled' }; case 'pending': default: return { text: 'Chờ duyệt', class: 'status-pending' }; } }
    function renderTable() {
        if (!scheduleTableBody) return; scheduleTableBody.innerHTML = '';
        const currentUserInfo = JSON.parse(localStorage.getItem(USER_STORAGE_KEY)); const userEmail = currentUserInfo ? currentUserInfo.email : null;
        let userSchedules = [];
        if (userEmail) { userSchedules = schedules.filter(s => s.email && s.email.toLowerCase() === userEmail.toLowerCase()); }
        else { scheduleTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Vui lòng đăng nhập để xem lịch tập.</td></tr>`; renderPagination(0, 0); return; }
         if (userSchedules.length === 0) { scheduleTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Bạn chưa đặt lịch nào.</td></tr>`; renderPagination(0, 0); return; }
        const totalItems = userSchedules.length; const totalPages = Math.ceil(totalItems / itemsPerPage);
        if (currentPage > totalPages && totalPages > 0) { currentPage = totalPages; } if (currentPage < 1 || !currentPage) { currentPage = 1; }
        const startIndex = (currentPage - 1) * itemsPerPage; const endIndex = startIndex + itemsPerPage;
        const sortedSchedules = userSchedules.sort((a, b) => { if (a.status === 'pending' && b.status !== 'pending') return -1; if (a.status !== 'pending' && b.status === 'pending') return 1; return new Date(b.date) - new Date(a.date); });
        const itemsToDisplay = sortedSchedules.slice(startIndex, endIndex);
        if (itemsToDisplay.length === 0 && currentPage > 1) { currentPage--; renderTable(); return; }
        itemsToDisplay.forEach(schedule => {
            const row = document.createElement('tr'); const statusInfo = getStatusInfo(schedule.status);
            const editButtonDisabled = schedule.status !== 'pending' ? 'disabled' : ''; const deleteButtonDisabled = schedule.status !== 'pending' ? 'disabled' : '';
            row.innerHTML = `<td>${schedule.type||'N/A'}</td><td>${schedule.date||'N/A'}</td><td>${schedule.time||'N/A'}</td><td>${schedule.name||'N/A'}</td><td>${schedule.email||'N/A'}</td><td><span class="status-badge ${statusInfo.class}">${statusInfo.text}</span></td><td><button class="btn-edit" data-id="${schedule.id}" ${editButtonDisabled}>Sửa</button><button class="btn-delete" data-id="${schedule.id}" ${deleteButtonDisabled}>Xóa</button></td>`;
            scheduleTableBody.appendChild(row);
        });
        addTableButtonListeners(); renderPagination(totalPages, totalItems);
    }
    function renderPagination(totalPages, totalItems) {
        if (!paginationControls) return; paginationControls.innerHTML = ''; if (totalPages <= 1) return;
        const prevLi = document.createElement('li'); prevLi.className = 'page-item'; if (currentPage === 1) { prevLi.classList.add('disabled'); } prevLi.innerHTML = `<a class="page-link" href="#" data-page="${currentPage - 1}">«</a>`; paginationControls.appendChild(prevLi);
        const maxPagesToShow = 5; let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2)); let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1); if (endPage - startPage + 1 < maxPagesToShow) { startPage = Math.max(1, endPage - maxPagesToShow + 1); }
        if (startPage > 1) { const firstPageLi = document.createElement('li'); firstPageLi.className = 'page-item'; firstPageLi.innerHTML = `<a class="page-link" href="#" data-page="1">1</a>`; paginationControls.appendChild(firstPageLi); if (startPage > 2) { const ellipsisLi = document.createElement('li'); ellipsisLi.className = 'page-item disabled'; ellipsisLi.innerHTML = `<span class="page-link">...</span>`; paginationControls.appendChild(ellipsisLi); } }
        for (let i = startPage; i <= endPage; i++) { const pageLi = document.createElement('li'); pageLi.className = 'page-item'; if (i === currentPage) { pageLi.classList.add('active'); pageLi.innerHTML = `<span class="page-link">${i}</span>`; } else { pageLi.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`; } paginationControls.appendChild(pageLi); }
        if (endPage < totalPages) { if (endPage < totalPages - 1) { const ellipsisLi = document.createElement('li'); ellipsisLi.className = 'page-item disabled'; ellipsisLi.innerHTML = `<span class="page-link">...</span>`; paginationControls.appendChild(ellipsisLi); } const lastPageLi = document.createElement('li'); lastPageLi.className = 'page-item'; lastPageLi.innerHTML = `<a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a>`; paginationControls.appendChild(lastPageLi); }
        const nextLi = document.createElement('li'); nextLi.className = 'page-item'; if (currentPage === totalPages) { nextLi.classList.add('disabled'); } nextLi.innerHTML = `<a class="page-link" href="#" data-page="${currentPage + 1}">»</a>`; paginationControls.appendChild(nextLi);
        paginationControls.querySelectorAll('.page-link').forEach(link => { if (link.parentElement && !link.parentElement.classList.contains('disabled') && !link.parentElement.classList.contains('active')) { link.addEventListener('click', (e) => { e.preventDefault(); const page = parseInt(e.target.dataset.page); if (page && page !== currentPage) { currentPage = page; renderTable(); } }); } });
    }
    function addTableButtonListeners() {
        if (!scheduleTableBody) return;
        scheduleTableBody.querySelectorAll('.btn-edit:not([disabled])').forEach(button => { button.removeEventListener('click', handleEdit); button.addEventListener('click', handleEdit); });
        scheduleTableBody.querySelectorAll('.btn-delete:not([disabled])').forEach(button => { button.removeEventListener('click', handleDelete); button.addEventListener('click', handleDelete); });
    }
    function showModal(isEdit = false, scheduleData = null) {
        hideModals(); if (!scheduleForm || !modalError || !modalTitle || !scheduleIdInput || !classTypeInput || !scheduleDateInput || !scheduleTimeInput || !fullNameInput || !emailInput || !modal) { console.error("Schedule modal elements not found!"); return; }
        scheduleForm.reset(); modalError.textContent = ''; currentScheduleToEdit = null; scheduleIdInput.value = '';
        loadServicesIntoDropdown(); // Always load services
        const currentUserInfo = JSON.parse(localStorage.getItem(USER_STORAGE_KEY));
        if (!isEdit && currentUserInfo) { emailInput.value = currentUserInfo.email || ''; fullNameInput.value = currentUserInfo.name || ''; /* emailInput.readOnly = true; fullNameInput.readOnly = true; */ }
        if (isEdit && scheduleData) {
            modalTitle.textContent = 'Sửa Lịch Tập'; scheduleIdInput.value = scheduleData.id;
            setTimeout(() => { classTypeInput.value = scheduleData.type; }, 0); // Allow dropdown to populate
            scheduleDateInput.value = scheduleData.date; scheduleTimeInput.value = scheduleData.time;
            fullNameInput.value = scheduleData.name; emailInput.value = scheduleData.email;
            currentScheduleToEdit = scheduleData;
        } else { modalTitle.textContent = 'Đặt Lịch Tập Mới'; }
        modal.style.display = 'flex';
    }
    function hideModals() { if (modal) modal.style.display = 'none'; if (deleteModal) deleteModal.style.display = 'none'; }
    function handleFormSubmit(event) {
        event.preventDefault(); if (!validateForm()) return;
        const scheduleInputData = { id: scheduleIdInput.value || `sch_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, type: classTypeInput.value, date: scheduleDateInput.value, time: scheduleTimeInput.value, name: fullNameInput.value.trim(), email: emailInput.value.trim(), status: currentScheduleToEdit ? currentScheduleToEdit.status : 'pending' };
        if (currentScheduleToEdit) {
            const index = schedules.findIndex(s => s.id === currentScheduleToEdit.id);
            if (index !== -1 && schedules[index].status === 'pending') { schedules[index] = scheduleInputData; saveSchedules(); renderTable(); hideModals(); }
            else { modalError.textContent = 'Không thể sửa lịch đã được duyệt hoặc hủy.'; }
        } else {
            schedules.push(scheduleInputData); saveSchedules();
            const currentUserInfo = JSON.parse(localStorage.getItem(USER_STORAGE_KEY)); const userEmail = currentUserInfo ? currentUserInfo.email : null; const totalItems = userEmail ? schedules.filter(s => s.email && s.email.toLowerCase() === userEmail.toLowerCase()).length : 0; currentPage = Math.ceil(totalItems / itemsPerPage) || 1;
            renderTable(); hideModals();
        }
    }
     function handleEdit(event) { const id = event.target.dataset.id; const scheduleToEdit = schedules.find(s => s.id === id); if (scheduleToEdit && scheduleToEdit.status === 'pending') { showModal(true, scheduleToEdit); } else if (scheduleToEdit) { alert('Không thể sửa lịch đã ' + (scheduleToEdit.status === 'approved' ? 'được duyệt.' : 'bị hủy.')); } }
     function handleDelete(event) { hideModals(); const id = event.target.dataset.id; const scheduleToDelete = schedules.find(s => s.id === id); if (scheduleToDelete && scheduleToDelete.status === 'pending') { currentScheduleIdToDelete = id; if(deleteModal) deleteModal.style.display = 'flex'; } else if (scheduleToDelete) { alert('Không thể xóa lịch đã ' + (scheduleToDelete.status === 'approved' ? 'được duyệt.' : 'bị hủy.')); } }
     function confirmDelete() {
         if (currentScheduleIdToDelete) {
             const index = schedules.findIndex(s => s.id === currentScheduleIdToDelete);
             if (index !== -1 && schedules[index].status === 'pending') {
                schedules.splice(index, 1); saveSchedules();
                const currentUserInfo = JSON.parse(localStorage.getItem(USER_STORAGE_KEY)); const userEmail = currentUserInfo ? currentUserInfo.email : null; const totalItems = userEmail ? schedules.filter(s => s.email && s.email.toLowerCase() === userEmail.toLowerCase()).length : 0; const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
                if (currentPage > totalPages) { currentPage = totalPages; } renderTable();
             } else { alert('Lịch này không còn ở trạng thái chờ duyệt.'); }
         }
         currentScheduleIdToDelete = null; hideModals();
     }

    // --- Event Listeners ---
    if (btnAddNew) btnAddNew.addEventListener('click', () => showModal(false));
    if (scheduleForm) scheduleForm.addEventListener('submit', handleFormSubmit);
    if (btnConfirmDelete) btnConfirmDelete.addEventListener('click', confirmDelete);
    // Listener chung cho nút đóng (span '×')
    closeButtons.forEach(button => { button.addEventListener('click', hideModals); });
    // Đóng modal khi click ra ngoài
    window.addEventListener('click', (event) => { if (event.target === modal || event.target === deleteModal) { hideModals(); } });

    // --- Initial Load ---
    loadSchedules(); renderTable();
});