document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    // Thêm kiểm tra null cho chắc chắn sau khi lấy element
    const serviceTableBody = document.getElementById('serviceTableBody');
    const addServiceBtn = document.getElementById('addServiceBtn');
    const serviceModal = document.getElementById('service-modal');
    const serviceModalTitle = document.getElementById('service-modal-title');
    const serviceForm = document.getElementById('service-form');
    const serviceIdInput = document.getElementById('service-id');
    const serviceNameInput = document.getElementById('service-name');
    const serviceDescriptionInput = document.getElementById('service-description');
    const serviceImageUrlInput = document.getElementById('service-image-url');
    const serviceModalError = document.getElementById('service-modal-error');
    const closeButtons = document.querySelectorAll('.modal .close-button'); // Lấy tất cả nút đóng
    const deleteModal = document.getElementById('delete-confirm-modal-service');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete-service');

    // --- Data ---
    let services = []; // Array to hold service objects
    let currentServiceIdToDelete = null;
    let currentServiceToEdit = null; // Store the service object being edited
    const STORAGE_KEY = 'gymServices'; // Key for localStorage

    // --- Functions ---

    // Load services from localStorage or generate sample data
    function loadServices() {
        const storedServices = localStorage.getItem(STORAGE_KEY);
        if (storedServices) {
            try {
                services = JSON.parse(storedServices) || [];
                if (!Array.isArray(services)) services = []; // Đảm bảo luôn là mảng
            } catch (e) {
                 console.error("Error parsing services from localStorage:", e);
                 services = []; // Reset nếu lỗi
            }
        }
         // Chỉ tạo mẫu nếu services rỗng sau khi load hoặc parse lỗi
        if (services.length === 0) {
             console.log("No services found or error parsing, generating sample data...");
             services = generateSampleServices();
             saveServices();
         }

        // Ensure IDs exist
        let needsSave = false;
        services.forEach((service, index) => {
            if (!service.id) {
                service.id = `srv_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 3)}`; // ID unique hơn
                needsSave = true;
            }
        });
        if (needsSave) saveServices();
    }

    // Save services to localStorage
    function saveServices() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(services));
    }

    // Generate sample service data
    function generateSampleServices() {
        return [
            { id: 'srv_1', name: 'Gym', description: 'Tập luyện với các thiết bị hiện đại', imageUrl: 'https://static.vecteezy.com/system/resources/thumbnails/031/691/648/small_2x/within-gym-with-modern-fitness-equipment-for-fitness-events-and-more-modern-of-gym-interior-with-equipment-sports-equipment-in-the-gym-created-with-generative-ai-photo.jpg' },
            { id: 'srv_2', name: 'Yoga', description: 'Thư giãn và cân bằng tâm trí', imageUrl: 'https://cdn.prod.website-files.com/65302a23c6b1d938427b07fe/666c4a49e519be9e21c75d64_yoga%20blog%20photo.jpg' },
            { id: 'srv_3', name: 'Zumba', description: 'Đốt cháy calories với những điệu nhảy sôi động', imageUrl: 'https://static.vecteezy.com/system/resources/previews/000/126/255/non_2x/free-zumba-dancers-vector.jpg' }
        ];
    }

    // Render the service table
    function renderServiceTable() {
        if (!serviceTableBody) return; // Kiểm tra element tồn tại
        serviceTableBody.innerHTML = '';
        if (services.length === 0) {
            serviceTableBody.innerHTML = `<tr><td colspan="4" class="empty-placeholder">Chưa có dịch vụ nào.</td></tr>`; // Thêm class để style nếu muốn
            return;
        }

        services.forEach(service => {
            const row = document.createElement('tr');
            const name = service.name || '';
            const description = service.description || '';
            const imageUrl = service.imageUrl || '';

            row.innerHTML = `
                <td>${escapeHtml(name)}</td>
                <td>${escapeHtml(description)}</td>
                <td><img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(name)}" class="service-table-image" onerror="this.style.display='none'; this.onerror=null;"></td><td>
                    <button class="btn-edit" data-id="${service.id}">Sửa</button>
                    <button class="btn-delete" data-id="${service.id}">Xóa</button>
                </td>
            `;
            serviceTableBody.appendChild(row);
        });

        addTableActionListeners();
    }

    // Add listeners to Edit/Delete buttons
    function addTableActionListeners() {
        if (!serviceTableBody) return;
        serviceTableBody.querySelectorAll('.btn-edit').forEach(button => {
            button.removeEventListener('click', handleEditService);
            button.addEventListener('click', handleEditService);
        });
        serviceTableBody.querySelectorAll('.btn-delete').forEach(button => {
            button.removeEventListener('click', handleDeleteService);
            button.addEventListener('click', handleDeleteService);
        });
    }

    // Basic HTML escaping function
    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return '';
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }

    // **QUAN TRỌNG: Hàm ẩn modal**
    function hideModals() {
        if (serviceModal) serviceModal.style.display = 'none'; // Đặt là none
        if (deleteModal) deleteModal.style.display = 'none'; // Đặt là none
    }

    // **QUAN TRỌNG: Hàm hiện modal Thêm/Sửa**
    function showServiceModal(isEdit = false, serviceData = null) {
        // Kiểm tra các element cần thiết
         if (!serviceForm || !serviceModalError || !serviceModalTitle || !serviceIdInput || !serviceNameInput || !serviceDescriptionInput || !serviceImageUrlInput || !serviceModal) {
              console.error("Một hoặc nhiều element của modal không tìm thấy!");
              return;
         }
        hideModals(); // Luôn ẩn các modal khác trước

        serviceForm.reset();
        serviceModalError.textContent = '';
        currentServiceToEdit = null;
        serviceIdInput.value = '';

        if (isEdit && serviceData) {
            serviceModalTitle.textContent = 'Sửa Dịch Vụ';
            serviceIdInput.value = serviceData.id;
            serviceNameInput.value = serviceData.name;
            serviceDescriptionInput.value = serviceData.description;
            serviceImageUrlInput.value = serviceData.imageUrl;
            currentServiceToEdit = serviceData;
        } else {
            serviceModalTitle.textContent = 'Thêm Dịch Vụ Mới';
        }
        serviceModal.style.display = 'flex'; // **Hiển thị bằng flex**
    }

    // Validate service form data
    function validateServiceForm() {
        if (!serviceModalError || !serviceNameInput || !serviceDescriptionInput || !serviceImageUrlInput) return false;
        serviceModalError.textContent = '';
        const name = serviceNameInput.value.trim();
        const description = serviceDescriptionInput.value.trim();
        const imageUrl = serviceImageUrlInput.value.trim();

        if (!name || !description || !imageUrl) {
            serviceModalError.textContent = 'Vui lòng điền đầy đủ thông tin dịch vụ.';
            return false;
        }
        try {
            new URL(imageUrl); // Kiểm tra URL hợp lệ
        } catch (_) {
            serviceModalError.textContent = 'URL hình ảnh không hợp lệ.';
            return false;
        }
        return true;
    }

    // Handle Add/Edit form submission
    function handleServiceFormSubmit(event) {
        event.preventDefault();
        if (!validateServiceForm()) {
            return;
        }
        const serviceData = {
            id: serviceIdInput.value || `srv_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name: serviceNameInput.value.trim(),
            description: serviceDescriptionInput.value.trim(),
            imageUrl: serviceImageUrlInput.value.trim()
        };

        if (currentServiceToEdit) { // Sửa
            const index = services.findIndex(s => s.id === currentServiceToEdit.id);
            if (index !== -1) services[index] = serviceData;
        } else { // Thêm
            services.push(serviceData);
        }
        saveServices();
        renderServiceTable();
        hideModals();
    }

    // Handle Edit button click
    function handleEditService(event) {
        const id = event.target.dataset.id;
        const serviceToEdit = services.find(s => s.id === id);
        if (serviceToEdit) {
            showServiceModal(true, serviceToEdit); // Gọi hàm hiển thị modal edit
        }
    }

    // **QUAN TRỌNG: Handle Delete button click (Show confirmation)**
    function handleDeleteService(event) {
        hideModals(); // Luôn ẩn các modal khác trước
        currentServiceIdToDelete = event.target.dataset.id;
        if (deleteModal) deleteModal.style.display = 'flex'; // **Hiển thị bằng flex**
    }

    // Handle Confirm Delete button click
    function confirmServiceDelete() {
        if (currentServiceIdToDelete) {
            services = services.filter(s => s.id !== currentServiceIdToDelete);
            saveServices();
            renderServiceTable();
        }
        currentServiceIdToDelete = null;
        hideModals();
    }

    // --- Event Listeners ---
    // Kiểm tra element tồn tại trước khi gắn listener
    if (addServiceBtn) {
        addServiceBtn.addEventListener('click', () => showServiceModal(false)); // Gọi hàm show add/edit
    } else {
        console.error("Button 'Thêm dịch vụ mới' (id='addServiceBtn') not found!");
    }

    if (serviceForm) {
        serviceForm.addEventListener('submit', handleServiceFormSubmit);
    } else {
         console.error("Form (id='service-form') not found!");
    }

    if (btnConfirmDelete) {
        btnConfirmDelete.addEventListener('click', confirmServiceDelete);
    } else {
         console.error("Button 'Xác nhận xóa' (id='btn-confirm-delete-service') not found!");
    }

    // Gắn listener cho TẤT CẢ các nút có class 'close-button' trong các modal
    closeButtons.forEach(button => {
        button.addEventListener('click', hideModals);
    });

    // Đóng modal khi click ra ngoài vùng nội dung
    window.addEventListener('click', (event) => {
        if (event.target === serviceModal || event.target === deleteModal) {
            hideModals();
        }
    });

    // --- Initial Load ---
    // Đảm bảo DOM đã sẵn sàng hoàn toàn
    loadServices();
    renderServiceTable();

}); // End DOMContentLoaded