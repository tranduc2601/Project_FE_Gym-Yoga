document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
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
    const closeButtons = document.querySelectorAll('.modal .close-button'); // General close buttons
    const serviceModalCloseButtons = document.querySelectorAll('.service-modal-close'); // Specific close buttons for this modal
    const deleteModal = document.getElementById('delete-confirm-modal-service');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete-service');
    const deleteModalCloseButtons = document.querySelectorAll('.delete-service-modal-close'); // Specific close for delete confirm

    // --- Data ---
    let services = [];
    let currentServiceIdToDelete = null;
    let currentServiceToEdit = null;
    const STORAGE_KEY = 'gymServices'; // Key for localStorage

    // --- Functions ---
    function loadServices() {
        const storedServices = localStorage.getItem(STORAGE_KEY);
        try { services = storedServices ? JSON.parse(storedServices) : []; if (!Array.isArray(services)) services = []; }
        catch (e) { console.error("Error parsing services:", e); services = []; }
        if (services.length === 0) { services = generateSampleServices(); saveServices(); } // Generate sample only if empty
        let needsSave = false;
        services.forEach((service, index) => { if (!service.id) { service.id = `srv_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 3)}`; needsSave = true; } });
        if (needsSave) saveServices();
    }
    function saveServices() { localStorage.setItem(STORAGE_KEY, JSON.stringify(services)); }
    function generateSampleServices() {
        return [
            { id: 'srv_1', name: 'Gym', description: 'Tập luyện với các thiết bị hiện đại', imageUrl: 'https://static.vecteezy.com/system/resources/thumbnails/031/691/648/small_2x/within-gym-with-modern-fitness-equipment-for-fitness-events-and-more-modern-of-gym-interior-with-equipment-sports-equipment-in-the-gym-created-with-generative-ai-photo.jpg' },
            { id: 'srv_2', name: 'Yoga', description: 'Thư giãn và cân bằng tâm trí', imageUrl: 'https://cdn.prod.website-files.com/65302a23c6b1d938427b07fe/666c4a49e519be9e21c75d64_yoga%20blog%20photo.jpg' },
            { id: 'srv_3', name: 'Zumba', description: 'Đốt cháy calories với những điệu nhảy sôi động', imageUrl: 'https://static.vecteezy.com/system/resources/previews/000/126/255/non_2x/free-zumba-dancers-vector.jpg' }
        ];
    }
     function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return '';
        return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
     }
    function renderServiceTable() {
        if (!serviceTableBody) return; serviceTableBody.innerHTML = '';
        if (services.length === 0) { serviceTableBody.innerHTML = `<tr><td colspan="4" class="empty-placeholder">Chưa có dịch vụ nào.</td></tr>`; return; }
        services.forEach(service => {
            const row = document.createElement('tr');
            const name = service.name || ''; const description = service.description || ''; const imageUrl = service.imageUrl || '';
            row.innerHTML = `<td>${escapeHtml(name)}</td><td>${escapeHtml(description)}</td><td><img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(name)}" class="service-table-image" onerror="this.style.display='none'; this.onerror=null;"></td><td><button class="btn-edit" data-id="${service.id}">Sửa</button><button class="btn-delete" data-id="${service.id}">Xóa</button></td>`;
            serviceTableBody.appendChild(row);
        });
        addTableActionListeners();
    }
    function addTableActionListeners() {
        if (!serviceTableBody) return;
        serviceTableBody.querySelectorAll('.btn-edit').forEach(b => { b.removeEventListener('click', handleEditService); b.addEventListener('click', handleEditService); });
        serviceTableBody.querySelectorAll('.btn-delete').forEach(b => { b.removeEventListener('click', handleDeleteService); b.addEventListener('click', handleDeleteService); });
    }
    function hideModals() { if (serviceModal) serviceModal.style.display = 'none'; if (deleteModal) deleteModal.style.display = 'none'; }
    function showServiceModal(isEdit = false, serviceData = null) {
         if (!serviceForm || !serviceModalError || !serviceModalTitle || !serviceIdInput || !serviceNameInput || !serviceDescriptionInput || !serviceImageUrlInput || !serviceModal) { console.error("Service modal elements missing!"); return; }
        hideModals(); serviceForm.reset(); serviceModalError.textContent = ''; currentServiceToEdit = null; serviceIdInput.value = '';
        if (isEdit && serviceData) {
            serviceModalTitle.textContent = 'Sửa Dịch Vụ'; serviceIdInput.value = serviceData.id; serviceNameInput.value = serviceData.name; serviceDescriptionInput.value = serviceData.description; serviceImageUrlInput.value = serviceData.imageUrl; currentServiceToEdit = serviceData;
        } else { serviceModalTitle.textContent = 'Thêm Dịch Vụ Mới'; }
        serviceModal.style.display = 'flex';
    }
    function validateServiceForm() {
        if (!serviceModalError || !serviceNameInput || !serviceDescriptionInput || !serviceImageUrlInput) return false; serviceModalError.textContent = '';
        const name = serviceNameInput.value.trim(); const description = serviceDescriptionInput.value.trim(); const imageUrl = serviceImageUrlInput.value.trim();
        if (!name || !description || !imageUrl) { serviceModalError.textContent = 'Vui lòng điền đầy đủ thông tin.'; return false; }
        try { new URL(imageUrl); } catch (_) { serviceModalError.textContent = 'URL hình ảnh không hợp lệ.'; return false; }
        return true;
    }
    function handleServiceFormSubmit(event) {
        event.preventDefault(); if (!validateServiceForm()) return;
        const serviceData = { id: serviceIdInput.value || `srv_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, name: serviceNameInput.value.trim(), description: serviceDescriptionInput.value.trim(), imageUrl: serviceImageUrlInput.value.trim() };
        if (currentServiceToEdit) { const index = services.findIndex(s => s.id === currentServiceToEdit.id); if (index !== -1) services[index] = serviceData; }
        else { services.push(serviceData); }
        saveServices(); renderServiceTable(); hideModals();
    }
    function handleEditService(event) { const id = event.target.dataset.id; const serviceToEdit = services.find(s => s.id === id); if (serviceToEdit) showServiceModal(true, serviceToEdit); }
    function handleDeleteService(event) { hideModals(); currentServiceIdToDelete = event.target.dataset.id; if (deleteModal) deleteModal.style.display = 'flex'; }
    function confirmServiceDelete() {
        if (currentServiceIdToDelete) { services = services.filter(s => s.id !== currentServiceIdToDelete); saveServices(); renderServiceTable(); }
        currentServiceIdToDelete = null; hideModals();
    }

    // --- Event Listeners ---
    if (addServiceBtn) { addServiceBtn.addEventListener('click', () => showServiceModal(false)); }
    if (serviceForm) { serviceForm.addEventListener('submit', handleServiceFormSubmit); }
    if (btnConfirmDelete) { btnConfirmDelete.addEventListener('click', confirmServiceDelete); }
    // Use specific close buttons for each modal
    serviceModalCloseButtons.forEach(button => button.addEventListener('click', hideModals));
    deleteModalCloseButtons.forEach(button => button.addEventListener('click', hideModals));
    // General close buttons (top-right X)
    closeButtons.forEach(button => { button.addEventListener('click', hideModals); });
    // Click outside modal
    window.addEventListener('click', (event) => { if (event.target === serviceModal || event.target === deleteModal) { hideModals(); } });

    // --- Initial Load ---
    loadServices(); renderServiceTable();
});