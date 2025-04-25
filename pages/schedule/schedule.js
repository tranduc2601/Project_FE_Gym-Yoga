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
    const closeButtons = document.querySelectorAll('.close-button'); // All close buttons

    const deleteModal = document.getElementById('delete-confirm-modal');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');

    // --- Data ---
    let schedules = []; // Mảng chứa toàn bộ lịch
    let currentScheduleIdToDelete = null; // ID lịch đang chờ xóa
    let currentScheduleToEdit = null; // Object lịch đang sửa
    let currentPage = 1;
    const itemsPerPage = 5; // Số mục trên mỗi trang

    // --- Functions ---

    // Load data from localStorage or generate sample data
    function loadSchedules() {
        const storedSchedules = localStorage.getItem('schedules');
        if (storedSchedules) {
            schedules = JSON.parse(storedSchedules);
        } else {
            // Generate sample data if localStorage is empty
            schedules = generateSampleData();
            saveSchedules(); // Save generated data
        }
        // Add IDs if missing (for older data potentially)
        schedules.forEach((schedule, index) => {
            if (!schedule.id) {
                schedule.id = `sch_${Date.now()}_${index}`;
            }
        });
        saveSchedules(); // Save again if IDs were added
    }

    // Save data to localStorage
    function saveSchedules() {
        localStorage.setItem('schedules', JSON.stringify(schedules));
    }

    // Generate some sample schedule data
    function generateSampleData() {
        console.log("Generating sample data...");
        return [
            { id: 'sch_1', type: 'Yoga', date: '2025-05-10', time: '07:00 - 08:00', name: 'Nguyễn Văn An', email: 'an.nv@example.com' },
            { id: 'sch_2', type: 'Gym', date: '2025-05-11', time: '18:00 - 19:00', name: 'Trần Thị Bình', email: 'binh.tt@example.com' },
            { id: 'sch_3', type: 'Zumba', date: '2025-05-12', time: '17:00 - 18:00', name: 'Lê Văn Cường', email: 'cuong.lv@example.com' },
            { id: 'sch_4', type: 'Yoga', date: '2025-05-13', time: '06:00 - 07:00', name: 'Phạm Thị Dung', email: 'dung.pt@example.com' },
            { id: 'sch_5', type: 'Gym', date: '2025-05-14', time: '19:00 - 20:00', name: 'Hoàng Văn Em', email: 'em.hv@example.com' },
            { id: 'sch_6', type: 'Yoga', date: '2025-05-15', time: '08:00 - 09:00', name: 'Vũ Thị Giang', email: 'giang.vt@example.com' },
            { id: 'sch_7', type: 'Zumba', date: '2025-05-16', time: '18:00 - 19:00', name: 'Đặng Văn Hùng', email: 'hung.dv@example.com' },
        ];
    }

    // Validate form data
    function validateForm() {
        modalError.textContent = ''; // Clear previous errors
        const type = classTypeInput.value;
        const date = scheduleDateInput.value;
        const time = scheduleTimeInput.value;
        const name = fullNameInput.value.trim();
        const email = emailInput.value.trim();
        const id = scheduleIdInput.value; // Get ID for duplicate check during edit

        if (!type || !date || !time || !name || !email) {
            modalError.textContent = 'Vui lòng điền đầy đủ thông tin.';
            return false;
        }
        // Basic email format validation
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
            schedule.id !== id // Ensure we don't compare the item with itself when editing
        );

        if (isDuplicate) {
             modalError.textContent = 'Lịch tập này đã tồn tại (trùng email, lớp, ngày, giờ).';
             return false;
        }

        return true;
    }

    // Render table with data for the current page
    function renderTable() {
        scheduleTableBody.innerHTML = ''; // Clear existing table rows
        if (schedules.length === 0) {
            scheduleTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Chưa có lịch tập nào.</td></tr>';
            renderPagination(0); // Render empty pagination
            return;
        }

        const totalItems = schedules.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        // Adjust currentPage if it's out of bounds (e.g., after deletion)
        if (currentPage > totalPages && totalPages > 0) {
            currentPage = totalPages;
        }
        if (currentPage < 1) {
            currentPage = 1;
        }


        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const itemsToDisplay = schedules.slice(startIndex, endIndex);

        if (itemsToDisplay.length === 0 && currentPage > 1) {
             // If current page becomes empty after deletion, go to previous page
             currentPage--;
             renderTable(); // Re-render the previous page
             return;
        }


        itemsToDisplay.forEach(schedule => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${schedule.type}</td>
                <td>${schedule.date}</td>
                <td>${schedule.time}</td>
                <td>${schedule.name}</td>
                <td>${schedule.email}</td>
                <td>
                    <button class="btn-edit" data-id="${schedule.id}">Sửa</button>
                    <button class="btn-delete" data-id="${schedule.id}">Xóa</button>
                </td>
            `;
            scheduleTableBody.appendChild(row);
        });

        // Add event listeners for edit/delete buttons AFTER rendering rows
        addTableButtonListeners();
        renderPagination(totalPages);
    }

    // Render pagination controls
    function renderPagination(totalPages) {
        paginationControls.innerHTML = ''; // Clear existing controls

        if (totalPages <= 1) return; // No pagination needed for 0 or 1 page

        // Previous Button
        const prevLi = document.createElement('li');
        prevLi.classList.add('page-item');
        if (currentPage === 1) {
            prevLi.classList.add('disabled');
        }
        prevLi.innerHTML = `<a class="page-link" href="#" data-page="${currentPage - 1}">&laquo;</a>`;
        paginationControls.appendChild(prevLi);

        // Page Number Buttons (simplified for now)
        for (let i = 1; i <= totalPages; i++) {
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

        // Next Button
        const nextLi = document.createElement('li');
        nextLi.classList.add('page-item');
        if (currentPage === totalPages) {
            nextLi.classList.add('disabled');
        }
        nextLi.innerHTML = `<a class="page-link" href="#" data-page="${currentPage + 1}">&raquo;</a>`;
        paginationControls.appendChild(nextLi);

        // Add event listeners for pagination links
        paginationControls.querySelectorAll('.page-link').forEach(link => {
             if (!link.parentElement.classList.contains('disabled') && !link.parentElement.classList.contains('active')) {
                 link.addEventListener('click', (e) => {
                     e.preventDefault();
                     currentPage = parseInt(e.target.dataset.page);
                     renderTable(); // Re-render table for the new page
                 });
             }
        });
    }


    // Add listeners to Edit/Delete buttons in the table
    function addTableButtonListeners() {
        scheduleTableBody.querySelectorAll('.btn-edit').forEach(button => {
            button.addEventListener('click', handleEdit);
        });
        scheduleTableBody.querySelectorAll('.btn-delete').forEach(button => {
            button.addEventListener('click', handleDelete);
        });
    }

    // Show modal
    function showModal(isEdit = false, scheduleData = null) {
        scheduleForm.reset(); // Clear form fields
        modalError.textContent = ''; // Clear previous errors
        currentScheduleToEdit = null; // Reset edit state
        scheduleIdInput.value = ''; // Clear hidden ID field

        if (isEdit && scheduleData) {
            // Populate form for editing
            modalTitle.textContent = 'Sửa Lịch Tập';
            scheduleIdInput.value = scheduleData.id; // Set hidden ID
            classTypeInput.value = scheduleData.type;
            scheduleDateInput.value = scheduleData.date;
            scheduleTimeInput.value = scheduleData.time;
            fullNameInput.value = scheduleData.name;
            emailInput.value = scheduleData.email;
            currentScheduleToEdit = scheduleData; // Store the original data
        } else {
            // Setup for adding new
            modalTitle.textContent = 'Thêm Lịch Tập Mới';
        }
        modal.style.display = 'block';
    }

    // Hide modal
    function hideModal() {
        modal.style.display = 'none';
        deleteModal.style.display = 'none'; // Ensure delete modal is also hidden
    }

    // Handle form submission (Add/Edit)
    function handleFormSubmit(event) {
        event.preventDefault();
        if (!validateForm()) {
            return;
        }

        const scheduleData = {
            id: scheduleIdInput.value || `sch_${Date.now()}`, // Generate new ID if adding
            type: classTypeInput.value,
            date: scheduleDateInput.value,
            time: scheduleTimeInput.value,
            name: fullNameInput.value.trim(),
            email: emailInput.value.trim()
        };

        if (currentScheduleToEdit) {
            // --- Editing ---
            const index = schedules.findIndex(s => s.id === currentScheduleToEdit.id);
            if (index !== -1) {
                schedules[index] = scheduleData;
            }
        } else {
            // --- Adding ---
            schedules.push(scheduleData);
        }

        saveSchedules(); // Save changes to localStorage
        renderTable(); // Re-render the table
        hideModal(); // Close the modal
    }

     // Handle Edit button click
     function handleEdit(event) {
         const id = event.target.dataset.id;
         const scheduleToEdit = schedules.find(s => s.id === id);
         if (scheduleToEdit) {
             showModal(true, scheduleToEdit);
         }
     }

     // Handle Delete button click (Show confirmation)
     function handleDelete(event) {
         currentScheduleIdToDelete = event.target.dataset.id;
         deleteModal.style.display = 'block';
     }

     // Handle Confirm Delete button click
     function confirmDelete() {
         if (currentScheduleIdToDelete) {
             schedules = schedules.filter(s => s.id !== currentScheduleIdToDelete);
             saveSchedules();
             renderTable(); // Re-render table
         }
         currentScheduleIdToDelete = null; // Reset ID
         hideModal(); // Hide both modals
     }


    // --- Event Listeners ---
    btnAddNew.addEventListener('click', () => showModal(false)); // Show modal for adding
    scheduleForm.addEventListener('submit', handleFormSubmit);
    btnConfirmDelete.addEventListener('click', confirmDelete);

    // Add listeners to all close buttons (X icon and Cancel buttons)
    closeButtons.forEach(button => {
        button.addEventListener('click', hideModal);
    });

    // Close modal if clicking outside the modal content
    window.addEventListener('click', (event) => {
        if (event.target === modal || event.target === deleteModal) {
            hideModal();
        }
    });

     // --- Navbar Login/Logout Logic (Copy from home.js if needed) ---
     // You'll need to copy/adapt the checkLoginStatus and handleLogout functions
     // from home.js if you want the navbar here to reflect login state.
     // Make sure the element IDs in schedule.html's navbar match those expected by the JS.


    // --- Initial Load ---
    loadSchedules(); // Load data when page loads
    renderTable();   // Render the initial table view

}); // End DOMContentLoaded