// Hàm kiểm tra trạng thái đăng nhập khi trang tải
function checkLoginStatus() {
    // ***** THAY ĐỔI Ở ĐÂY: Đọc key 'currentUser' *****
    const userInfo = JSON.parse(localStorage.getItem('currentUser'));

    // Lấy các element từ HTML (đã được thêm vào home.html)
    const userInfoLi = document.getElementById('user-info'); // Thẻ <li> chứa thông tin user
    const usernameSpan = document.getElementById('username'); // Thẻ <strong> hiển thị tên
    const manageLink = document.getElementById('manage-link');   // Link Quản lý (cho admin)
    const logoutButton = document.getElementById('logout-button'); // Nút Đăng xuất
    const loginLinkLi = document.getElementById('login-link')?.parentElement; // Thẻ <li> chứa link Đăng nhập

    if (userInfo && userInfo.email) { // Kiểm tra xem có thông tin user không
        // === ĐÃ ĐĂNG NHẬP ===
        // Hiển thị tên (lấy từ thuộc tính 'name' nếu có, không thì dùng email)
        usernameSpan.textContent = userInfo.name || userInfo.email;
        userInfoLi.style.display = 'inline-block'; // Hiện mục thông tin user (dùng inline-block vì là li)

        if (loginLinkLi) {
            loginLinkLi.style.display = 'none'; // Ẩn mục li chứa link Đăng nhập
        }

        // Kiểm tra vai trò 'admin' để hiện link Quản lý
        if (userInfo.role === 'admin') {
            manageLink.style.display = 'inline'; // Hiện link Quản lý
        } else {
            manageLink.style.display = 'none';  // Ẩn link Quản lý với user thường
        }

        // Gán sự kiện cho nút Đăng xuất
        logoutButton.addEventListener('click', handleLogout);

    } else {
        // === CHƯA ĐĂNG NHẬP ===
        userInfoLi.style.display = 'none';  // Ẩn mục thông tin user
        if (loginLinkLi) {
            loginLinkLi.style.display = 'inline-block'; // Hiện mục li chứa link Đăng nhập
        }
        // Đảm bảo link Quản lý cũng ẩn nếu chưa đăng nhập
        manageLink.style.display = 'none';
    }
}

// Hàm xử lý đăng xuất
async function handleLogout() {
    try {
        // Tùy chọn: Gọi API backend để hủy session/token phía server nếu có
        // await fetch('/api/logout', { method: 'POST' });
    } catch (error) {
        console.error("Lỗi khi gọi API logout:", error);
    } finally {
         // ***** THAY ĐỔI Ở ĐÂY: Xóa key 'currentUser' *****
        localStorage.removeItem('currentUser');
        // ***** THAY ĐỔI Ở ĐÂY: Chuyển hướng về trang login *****
        window.location.href = '../login/login.html';
    }
}

// Chạy kiểm tra khi nội dung trang đã tải xong
document.addEventListener('DOMContentLoaded', checkLoginStatus);