document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const scheduleTableBody = document.getElementById('schedule-list-body');
    const paginationControls = document.getElementById('pagination-controls');
    const btnAddNew = document.getElementById('btn-add-new');
    const modal = document.getElementById('schedule-modal');
    const modalTitle = document.getElementById('modal-title');
    const scheduleForm = document.getElementById('schedule-form');
    const scheduleIdInput = document.getElementById('schedule-id');
    const classTypeInput = document.getElementById('class-type'); // Dropdown lớp học
    const scheduleDateInput = document.getElementById('schedule-date');
    const scheduleTimeInput = document.getElementById('schedule-time');
    const fullNameInput = document.getElementById('full-name');
    const emailInput = document.getElementById('email');
    const modalError = document.getElementById('modal-error');
    const closeButtons = document.querySelectorAll('.modal .close-button'); // Lấy tất cả nút đóng trong các modal

    const deleteModal = document.getElementById('delete-confirm-modal');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');

    // --- Data ---
    let schedules = []; // Mảng chứa toàn bộ lịch
    let currentScheduleIdToDelete = null;
    let currentScheduleToEdit = null;
    let currentPage = 1;
    const itemsPerPage = 5;
    const SCHEDULE_STORAGE_KEY = 'schedules'; // Key cho lịch tập
    const SERVICE_STORAGE_KEY = 'gymServices'; // Key cho dịch vụ (do admin quản lý)

    // --- Functions ---

    // Load data from localStorage
    function loadSchedules() {
        const storedSchedules = localStorage.getItem(SCHEDULE_STORAGE_KEY);
        try {
            schedules = storedSchedules ? JSON.parse(storedSchedules) : [];
            if (!Array.isArray(schedules)) schedules = [];
        } catch(e) {
            console.error("Error parsing schedules:", e);
            schedules = [];
        }
        // Add IDs and default status if missing
        let needsSave = false;
        schedules.forEach((schedule, index) => {
            if (!schedule.id) {
                schedule.id = `sch_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 3)}`;
                needsSave = true;
            }
            if (!schedule.status) { // Thêm status mặc định nếu chưa có
                schedule.status = 'pending'; // Hoặc 'approved' nếu là dữ liệu cũ
                 needsSave = true;
            }
        });
       if(needsSave) saveSchedules();
    }

    // Save data to localStorage
    function saveSchedules() {
        localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(schedules));
    }

    // Load services into the dropdown
    function loadServicesIntoDropdown() {
        const storedServices = localStorage.getItem(SERVICE_STORAGE_KEY);
        let services = [];
        try {
            services = storedServices ? JSON.parse(storedServices) : [];
            if (!Array.isArray(services)) services = [];
        } catch(e) {
            console.error("Error parsing services for dropdown:", e);
            services = [];
        }

        if (!classTypeInput) return; // Kiểm tra element

        classTypeInput.innerHTML = '<option value="">-- Chọn lớp học --</option>'; // Reset dropdown

        if (services.length > 0) {
            services.forEach(service => {
                const option = document.createElement('option');
                option.value = service.name; // Lưu tên dịch vụ làm value
                option.textContent = service.name; // Hiển thị tên dịch vụ
                classTypeInput.appendChild(option);
            });
            classTypeInput.disabled = false;
        } else {
             classTypeInput.innerHTML = '<option value="">-- Chưa có dịch vụ --</option>';
             classTypeInput.disabled = true;
        }
    }


    // Validate form data
    function validateForm() {
        if (!modalError || !classTypeInput || !scheduleDateInput || !scheduleTimeInput || !fullNameInput || !emailInput) {
            console.error("Thiếu element trong form đặt lịch user");
            return false;
        }
        modalError.textContent = '';
        const type = classTypeInput.value;
        const date = scheduleDateInput.value;
        const time = scheduleTimeInput.value;
        const name = fullNameInput.value.trim();
        const email = emailInput.value.trim();
        const id = scheduleIdInput.value;

        if (!type || !date || !time || !name || !email) {
            modalError.textContent = 'Vui lòng điền đầy đủ thông tin.';
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            modalError.textContent = 'Định dạng email không hợp lệ.';
            return false;
        }

        // --- Duplicate Check (Same person, same class, same date, same time) ---
        const isDuplicate = schedules.some(schedule =>
            schedule.email.toLowerCase() === email.toLowerCase() &&
            schedule.date === date &&
            schedule.time === time &&
            schedule.type === type &&
            schedule.id !== id && // Exclude self during edit
            schedule.status !== 'cancelled' // Không tính lịch đã hủy
        );

        if (isDuplicate) {
             modalError.textContent = 'Lịch tập này đang chờ duyệt hoặc đã được duyệt (trùng email, lớp, ngày, giờ).';
             return false;
        }

        return true;
    }

    // Function to get status text and class
    function getStatusInfo(status) {
        switch (status) {
            case 'approved':
                return { text: 'Đã duyệt', class: 'status-approved' };
            case 'cancelled':
                return { text: 'Đã hủy', class: 'status-cancelled' };
            case 'pending':
            default:
                return { text: 'Chờ duyệt', class: 'status-pending' };
        }
    }


    // Render table with data for the current page
    function renderTable() {
        if (!scheduleTableBody) return;
        scheduleTableBody.innerHTML = '';

        // --- Lọc lịch theo user đang đăng nhập ---
        const currentUserInfo = JSON.parse(localStorage.getItem('currentUser'));
        const userEmail = currentUserInfo ? currentUserInfo.email : null;

        let userSchedules = [];
        if (userEmail) {
            // Lấy tất cả lịch của user này
            userSchedules = schedules.filter(s => s.email && s.email.toLowerCase() === userEmail.toLowerCase());
        } else {
            // Nếu không có thông tin user, hiển thị thông báo
            scheduleTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Vui lòng đăng nhập để xem lịch tập.</td></tr>`;
            renderPagination(0, 0);
            return;
        }
         // --- Kết thúc lọc ---

         if (userSchedules.length === 0) {
            scheduleTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Bạn chưa đặt lịch nào.</td></tr>`; // Cập nhật colspan
            renderPagination(0, 0); // Render empty pagination
            return;
        }


        const totalItems = userSchedules.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        if (currentPage > totalPages && totalPages > 0) {
            currentPage = totalPages;
        }
        if (currentPage < 1 || !currentPage) { // Xử lý trường hợp currentPage không hợp lệ
            currentPage = 1;
        }

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        // Sắp xếp lịch mới nhất lên đầu trước khi cắt trang
        const sortedSchedules = userSchedules.sort((a, b) => {
             // Ưu tiên 'pending'
             if (a.status === 'pending' && b.status !== 'pending') return -1;
             if (a.status !== 'pending' && b.status === 'pending') return 1;
             // Nếu cùng trạng thái hoặc không phải pending, sắp xếp theo ngày giảm dần
             return new Date(b.date) - new Date(a.date);
        });
        const itemsToDisplay = sortedSchedules.slice(startIndex, endIndex);

        // Xử lý trường hợp trang hiện tại rỗng sau khi xóa item cuối cùng của trang đó
        if (itemsToDisplay.length === 0 && currentPage > 1) {
             currentPage--; // Lùi về trang trước
             renderTable(); // Render lại trang trước đó
             return;
        }


        itemsToDisplay.forEach(schedule => {
            const row = document.createElement('tr');
            const statusInfo = getStatusInfo(schedule.status);

            // Vô hiệu hóa nút sửa/xóa nếu không phải 'pending'
            const editButtonDisabled = schedule.status !== 'pending' ? 'disabled' : '';
            const deleteButtonDisabled = schedule.status !== 'pending' ? 'disabled' : '';

            row.innerHTML = `
                <td>${schedule.type || 'N/A'}</td>
                <td>${schedule.date || 'N/A'}</td>
                <td>${schedule.time || 'N/A'}</td>
                <td>${schedule.name || 'N/A'}</td>
                <td>${schedule.email || 'N/A'}</td>
                <td><span class="status-badge ${statusInfo.class}">${statusInfo.text}</span></td> <td>
                    <button class="btn-edit" data-id="${schedule.id}" ${editButtonDisabled}>Sửa</button>
                    <button class="btn-delete" data-id="${schedule.id}" ${deleteButtonDisabled}>Xóa</button>
                </td>
            `;
            scheduleTableBody.appendChild(row);
        });

        addTableButtonListeners();
        renderPagination(totalPages, totalItems); // Truyền totalPages và totalItems
    }

    // Render pagination controls
    function renderPagination(totalPages, totalItems) { // Nhận totalItems
        if (!paginationControls) return; // Kiểm tra element
        paginationControls.innerHTML = '';

        if (totalPages <= 1) return;

        // Previous Button
        const prevLi = document.createElement('li');
        prevLi.classList.add('page-item');
        if (currentPage === 1) {
            prevLi.classList.add('disabled');
        }
        prevLi.innerHTML = `<a class="page-link" href="#" data-page="${currentPage - 1}">«</a>`;
        paginationControls.appendChild(prevLi);

        // Page Number Buttons (Hiển thị giới hạn số trang nếu cần)
        const maxPagesToShow = 5; // Ví dụ: chỉ hiển thị 5 nút số trang
        let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

        // Điều chỉnh lại nếu bị lệch ở đầu hoặc cuối
        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }

        if (startPage > 1) { // Nút '...' ở đầu
            const firstPageLi = document.createElement('li');
            firstPageLi.classList.add('page-item');
            firstPageLi.innerHTML = `<a class="page-link" href="#" data-page="1">1</a>`;
            paginationControls.appendChild(firstPageLi);
            if (startPage > 2) {
                 const ellipsisLi = document.createElement('li');
                 ellipsisLi.classList.add('page-item', 'disabled');
                 ellipsisLi.innerHTML = `<span class="page-link">...</span>`;
                 paginationControls.appendChild(ellipsisLi);
            }
        }


        for (let i = startPage; i <= endPage; i++) {
            const pageLi = document.createElement('li');
            pageLi.classList.add('page-item');
            if (i === currentPage) {
                pageLi.classList.add('active');
                pageLi.innerHTML = `<span class="page-link">${i}</span>`;
            } else {
                pageLi.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
            }
            paginationControls.appendChild(pageLi);
        }

         if (endPage < totalPages) { // Nút '...' ở cuối
             if (endPage < totalPages - 1) {
                 const ellipsisLi = document.createElement('li');
                 ellipsisLi.classList.add('page-item', 'disabled');
                 ellipsisLi.innerHTML = `<span class="page-link">...</span>`;
                 paginationControls.appendChild(ellipsisLi);
             }
             const lastPageLi = document.createElement('li');
             lastPageLi.classList.add('page-item');
             lastPageLi.innerHTML = `<a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a>`;
             paginationControls.appendChild(lastPageLi);
         }


        // Next Button
        const nextLi = document.createElement('li');
        nextLi.classList.add('page-item');
        if (currentPage === totalPages) {
            nextLi.classList.add('disabled');
        }
        nextLi.innerHTML = `<a class="page-link" href="#" data-page="${currentPage + 1}">»</a>`;
        paginationControls.appendChild(nextLi);

        paginationControls.querySelectorAll('.page-link').forEach(link => {
             if (link.parentElement && !link.parentElement.classList.contains('disabled') && !link.parentElement.classList.contains('active')) {
                 link.addEventListener('click', (e) => {
                     e.preventDefault();
                     const page = parseInt(e.target.dataset.page);
                     if (page && page !== currentPage) { // Chỉ thay đổi nếu page hợp lệ và khác trang hiện tại
                        currentPage = page;
                        renderTable(); // Render lại bảng cho trang mới
                     }
                 });
             }
        });
    }


    // Add listeners to Edit/Delete buttons in the table
    function addTableButtonListeners() {
        if (!scheduleTableBody) return;
        scheduleTableBody.querySelectorAll('.btn-edit:not([disabled])').forEach(button => {
            button.removeEventListener('click', handleEdit); // Xóa listener cũ trước khi thêm mới
            button.addEventListener('click', handleEdit);
        });
        scheduleTableBody.querySelectorAll('.btn-delete:not([disabled])').forEach(button => {
             button.removeEventListener('click', handleDelete); // Xóa listener cũ trước khi thêm mới
            button.addEventListener('click', handleDelete);
        });
    }

    // Show modal
    function showModal(isEdit = false, scheduleData = null) {
        hideModals();
        if (!scheduleForm || !modalError || !modalTitle || !scheduleIdInput || !classTypeInput || !scheduleDateInput || !scheduleTimeInput || !fullNameInput || !emailInput || !modal) {
            console.error("Một hoặc nhiều element của modal đặt lịch user không tìm thấy!");
            return;
        }

        scheduleForm.reset();
        modalError.textContent = '';
        currentScheduleToEdit = null;
        scheduleIdInput.value = '';

        // Luôn tải lại danh sách dịch vụ khi mở modal
        loadServicesIntoDropdown();

        // Tự động điền email và tên nếu user đã đăng nhập và không phải là sửa
        const currentUserInfo = JSON.parse(localStorage.getItem('currentUser'));
        if (!isEdit && currentUserInfo) {
            emailInput.value = currentUserInfo.email || '';
            fullNameInput.value = currentUserInfo.name || '';
            // emailInput.readOnly = true; // Bỏ readonly nếu muốn user có thể sửa
            // fullNameInput.readOnly = true;
        }

        if (isEdit && scheduleData) {
            modalTitle.textContent = 'Sửa Lịch Tập';
            scheduleIdInput.value = scheduleData.id;
            // Đợi dropdown load xong rồi mới set value (nếu cần thiết)
            setTimeout(() => { classTypeInput.value = scheduleData.type; }, 0);
            scheduleDateInput.value = scheduleData.date;
            scheduleTimeInput.value = scheduleData.time;
            fullNameInput.value = scheduleData.name;
            emailInput.value = scheduleData.email;
            currentScheduleToEdit = scheduleData;
        } else {
            modalTitle.textContent = 'Đặt Lịch Tập Mới';
        }
        modal.style.display = 'flex'; // Hiển thị modal bằng flex
    }

    // Hide all modals
    function hideModals() {
        if (modal) modal.style.display = 'none';
        if (deleteModal) deleteModal.style.display = 'none';
    }

    // Handle form submission (Add/Edit)
    function handleFormSubmit(event) {
        event.preventDefault();
        if (!validateForm()) {
            return;
        }

        const scheduleData = {
            id: scheduleIdInput.value || `sch_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            type: classTypeInput.value,
            date: scheduleDateInput.value,
            time: scheduleTimeInput.value,
            name: fullNameInput.value.trim(),
            email: emailInput.value.trim(),
            status: currentScheduleToEdit ? currentScheduleToEdit.status : 'pending' // Giữ status khi sửa, là 'pending' khi mới
        };

        if (currentScheduleToEdit) {
            // --- Editing ---
            const index = schedules.findIndex(s => s.id === currentScheduleToEdit.id);
            if (index !== -1 && schedules[index].status === 'pending') {
                schedules[index] = scheduleData;
                saveSchedules();
                renderTable();
                hideModals();
            } else {
                modalError.textContent = 'Không thể sửa lịch đã được duyệt hoặc hủy.';
            }
        } else {
            // --- Adding ---
            schedules.push(scheduleData);
            saveSchedules();
            // Đi đến trang cuối cùng (hoặc trang 1) sau khi thêm mới
            const currentUserInfo = JSON.parse(localStorage.getItem('currentUser'));
            const userEmail = currentUserInfo ? currentUserInfo.email : null;
            const totalItems = userEmail ? schedules.filter(s => s.email && s.email.toLowerCase() === userEmail.toLowerCase()).length : 0;
            currentPage = Math.ceil(totalItems / itemsPerPage) || 1; // Đảm bảo ít nhất là trang 1
            renderTable();
            hideModals();
        }
    }

     // Handle Edit button click
     function handleEdit(event) {
         const id = event.target.dataset.id;
         const scheduleToEdit = schedules.find(s => s.id === id);
         if (scheduleToEdit && scheduleToEdit.status === 'pending') {
             showModal(true, scheduleToEdit);
         } else if (scheduleToEdit) {
             alert('Không thể sửa lịch đã ' + (scheduleToEdit.status === 'approved' ? 'được duyệt.' : 'bị hủy.'));
         }
     }

     // Handle Delete button click (Show confirmation)
     function handleDelete(event) {
         hideModals();
         const id = event.target.dataset.id;
         const scheduleToDelete = schedules.find(s => s.id === id);
         if (scheduleToDelete && scheduleToDelete.status === 'pending') {
            currentScheduleIdToDelete = id;
            if(deleteModal) deleteModal.style.display = 'flex';
         } else if (scheduleToDelete) {
             alert('Không thể xóa lịch đã ' + (scheduleToDelete.status === 'approved' ? 'được duyệt.' : 'bị hủy.'));
         }
     }

     // Handle Confirm Delete button click
     function confirmDelete() {
         if (currentScheduleIdToDelete) {
             const index = schedules.findIndex(s => s.id === currentScheduleIdToDelete);
             if (index !== -1 && schedules[index].status === 'pending') {
                schedules.splice(index, 1);
                saveSchedules();
                // Sau khi xóa, render lại trang hiện tại hoặc trang trước nếu trang hiện tại rỗng
                const currentUserInfo = JSON.parse(localStorage.getItem('currentUser'));
                const userEmail = currentUserInfo ? currentUserInfo.email : null;
                const totalItems = userEmail ? schedules.filter(s => s.email && s.email.toLowerCase() === userEmail.toLowerCase()).length : 0;
                const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
                if (currentPage > totalPages) {
                    currentPage = totalPages; // Đặt lại currentPage nếu nó vượt quá số trang mới
                }
                renderTable(); // Render lại
             } else {
                 alert('Lịch này không còn ở trạng thái chờ duyệt.');
             }
         }
         currentScheduleIdToDelete = null;
         hideModals();
     }


    // --- Event Listeners ---
    if (btnAddNew) {
        btnAddNew.addEventListener('click', () => showModal(false));
    }
    if (scheduleForm) {
        scheduleForm.addEventListener('submit', handleFormSubmit);
    }
    if (btnConfirmDelete) {
        btnConfirmDelete.addEventListener('click', confirmDelete);
    }

    // Listener chung cho tất cả nút đóng modal
    closeButtons.forEach(button => {
        button.addEventListener('click', hideModals);
    });

    // Đóng modal khi click ra ngoài vùng nội dung
    window.addEventListener('click', (event) => {
        if (event.target === modal || event.target === deleteModal) {
            hideModals();
        }
    });

    // --- Initial Load ---
    loadSchedules(); // Tải lịch trước
    // Không cần gọi loadServicesIntoDropdown ở đây vì nó được gọi khi mở modal
    renderTable(); // Render bảng lần đầu

}); // End DOMContentLoaded