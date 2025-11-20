// Version 2.0 - Logic tải data trước, quét sau
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSPhZG8XeQtXDs_9KahSED37StkvPTPZUlGNjfv7eBIvqurKoMLSCl3lhzFLS45h96YqP5C3buifgCc/pub?output=csv';

let inventoryData = [];
let html5QrcodeScanner = null;
const beepSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3');

// 1. Tải dữ liệu ngay khi vào trang
function loadInventoryData() {
    const statusMsg = document.getElementById('status-msg');
    statusMsg.textContent = "⏳ Đang tải dữ liệu từ kho...";
    statusMsg.style.color = "orange";

    Papa.parse(CSV_URL, {
        download: true,
        header: true,
        complete: function(results) {
            inventoryData = results.data;
            // Cập nhật trạng thái như hình mẫu
            statusMsg.innerHTML = `✅ Đã tải <b>${inventoryData.length}</b> dòng dữ liệu.<br>Sẵn sàng quét mã.`;
            statusMsg.style.color = "green";
            
            // Bật nút bấm (nếu cần disable trước đó)
            document.getElementById('btn-start-scan').disabled = false;
        },
        error: function(err) {
            statusMsg.textContent = "❌ Lỗi kết nối! Vui lòng tải lại trang.";
            statusMsg.style.color = "red";
            console.error(err);
        }
    });
}

// 2. Hàm Bật Camera (Chỉ chạy khi bấm nút)
function startCamera() {
    // Ẩn thông báo và nút bấm để nhường chỗ cho Camera (hoặc giữ lại tùy ý thích)
    // Ở đây tôi giữ nút bấm nhưng ẩn kết quả cũ đi
    document.getElementById('scanner-wrapper').classList.remove('hidden');
    document.getElementById('result-card').classList.add('hidden');
    document.getElementById('status-msg').textContent = "📷 Đang mở camera...";

    // Khởi tạo Scanner
    if (!html5QrcodeScanner) {
        html5QrcodeScanner = new Html5QrcodeScanner(
            "reader", 
            { 
                fps: 10, 
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            },
            false
        );
    }

    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
}

// 3. Hàm Dừng Camera
function stopCamera() {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().then(() => {
            document.getElementById('scanner-wrapper').classList.add('hidden');
            document.getElementById('status-msg').innerHTML = `✅ Đã tải <b>${inventoryData.length}</b> sản phẩm. Sẵn sàng.`;
        }).catch(error => {
            console.error("Failed to clear html5QrcodeScanner. ", error);
        });
    }
}

// 4. Xử lý khi quét thành công
function onScanSuccess(decodedText, decodedResult) {
    // Dừng camera sau khi quét được
    stopCamera();
    
    // Phát âm thanh
    beepSound.play().catch(e => console.log("Audio blocked"));

    // Tìm kiếm
    lookupProduct(decodedText);
}

function onScanFailure(error) {
    // Không làm gì cả để tránh spam log
}

// 5. Hàm tìm kiếm và tính tổng
function lookupProduct(code) {
    const products = inventoryData.filter(row => 
        row['Mã sản phẩm'] && row['Mã sản phẩm'].trim() === code.trim()
    );

    if (products.length > 0) {
        const productName = products[0]['Tên sản phẩm'];
        const totalQuantity = products.reduce((sum, row) => {
            let qty = parseInt(row['Số lượng']);
            return sum + (isNaN(qty) ? 0 : qty);
        }, 0);

        displayResult(code, productName, totalQuantity);
    } else {
        alert(`⚠️ Không tìm thấy sản phẩm mã: ${code}`);
        // Hiện lại trạng thái sẵn sàng
        document.getElementById('status-msg').innerHTML = `✅ Sẵn sàng quét mã khác.`;
    }
}

function displayResult(code, name, total) {
    const resCard = document.getElementById('result-card');
    resCard.classList.remove('hidden');
    
    document.getElementById('res-code').textContent = code;
    document.getElementById('res-name').textContent = name;
    document.getElementById('res-total').textContent = total;
}

// Chạy hàm tải dữ liệu khi mở web
window.onload = loadInventoryData;