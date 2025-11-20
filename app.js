// Version 1.0 - Logic xử lý dữ liệu và Camera
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSPhZG8XeQtXDs_9KahSED37StkvPTPZUlGNjfv7eBIvqurKoMLSCl3lhzFLS45h96YqP5C3buifgCc/pub?output=csv';

// Biến lưu trữ dữ liệu kho trong bộ nhớ
let inventoryData = [];
let isDataLoaded = false;

// Âm thanh 'Beep' khi quét thành công
const beepSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3'); 

// 1. Hàm tải và xử lý dữ liệu CSV ngay khi mở web
function loadInventoryData() {
    const loadingText = document.getElementById('loading-text');
    if(loadingText) loadingText.style.display = 'block';

    Papa.parse(CSV_URL, {
        download: true,
        header: true, // Dòng đầu tiên là tiêu đề cột
        complete: function(results) {
            inventoryData = results.data;
            isDataLoaded = true;
            console.log("Đã tải xong dữ liệu: " + inventoryData.length + " dòng.");
            if(loadingText) loadingText.style.display = 'none';
            startScanner(); // Dữ liệu xong thì mới bật camera
        },
        error: function(err) {
            console.error("Lỗi tải CSV:", err);
            alert("Không thể tải dữ liệu kho. Vui lòng kiểm tra kết nối mạng!");
        }
    });
}

// 2. Hàm tìm kiếm và tính toán
function lookupProduct(code) {
    if (!isDataLoaded) {
        alert("Dữ liệu đang tải, vui lòng đợi...");
        return;
    }

    console.log("Đang tìm mã:", code);

    // Lọc tất cả các dòng có 'Mã sản phẩm' trùng khớp (chính xác 100%)
    // Lưu ý: Trim() để loại bỏ khoảng trắng thừa nếu có
    const products = inventoryData.filter(row => 
        row['Mã sản phẩm'] && row['Mã sản phẩm'].trim() === code.trim()
    );

    if (products.length > 0) {
        // Lấy tên sản phẩm từ dòng đầu tiên tìm thấy
        const productName = products[0]['Tên sản phẩm'];
        
        // Tính tổng số lượng (Cần chuyển đổi string sang number)
        const totalQuantity = products.reduce((sum, row) => {
            // Xử lý trường hợp ô số lượng bị trống hoặc lỗi
            let qty = parseInt(row['Số lượng']);
            if (isNaN(qty)) qty = 0;
            return sum + qty;
        }, 0);

        displayResult(code, productName, totalQuantity);
        beepSound.play().catch(e => console.log("Audio play blocked")); // Phát âm thanh
    } else {
        alert(`Không tìm thấy sản phẩm có mã: ${code}`);
    }
}

// 3. Hiển thị kết quả ra màn hình
function displayResult(code, name, total) {
    document.getElementById('result-card').classList.remove('hidden');
    document.getElementById('res-code').textContent = code;
    document.getElementById('res-name').textContent = name;
    document.getElementById('res-total').textContent = total;
}

// 4. Cấu hình và khởi động Camera (Html5Qrcode)
function startScanner() {
    const html5QrcodeScanner = new Html5QrcodeScanner(
        "reader", 
        { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
        },
        /* verbose= */ false
    );

    function onScanSuccess(decodedText, decodedResult) {
        // Tạm dừng quét 1 chút để người dùng xem kết quả, tránh quét liên tục
        html5QrcodeScanner.clear(); 
        
        lookupProduct(decodedText);

        // Sau 3 giây hoặc khi người dùng bấm nút (tùy chọn sau này), có thể quét lại
        // Ở đây tôi để hiện kết quả, muốn quét tiếp phải reload hoặc thêm nút 'Quét tiếp'
        // Để đơn giản cho bản V1, tôi sẽ tạo nút "Quét Tiếp" trong bước cập nhật sau nếu bạn cần.
        // Hiện tại: Sau khi quét xong, camera tắt để hiện kết quả rõ ràng.
        createRescanButton();
    }

    function onScanFailure(error) {
        // handle scan failure, usually better to ignore and keep scanning.
        // console.warn(`Code scan error = ${error}`);
    }

    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
}

// Hàm tạo nút quét lại (được gọi sau khi quét xong)
function createRescanButton() {
    const container = document.querySelector('.scanner-container');
    container.innerHTML = '<button style="width:100%; padding:15px; background:var(--primary-color); color:white; border:none; border-radius:10px; font-size:1.1rem; font-weight:bold; margin-top:20px;" onclick="location.reload()">📷 Quét Mã Khác</button>';
}

// Chạy ứng dụng
window.onload = loadInventoryData;