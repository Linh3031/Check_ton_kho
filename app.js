// Version 2.1 - Fix lỗi đen màn hình (Force Back Camera)
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSPhZG8XeQtXDs_9KahSED37StkvPTPZUlGNjfv7eBIvqurKoMLSCl3lhzFLS45h96YqP5C3buifgCc/pub?output=csv';

let inventoryData = [];
let html5QrCode = null; // Đổi tên biến để dùng Class mới
const beepSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3');

// 1. Tải dữ liệu
function loadInventoryData() {
    const statusMsg = document.getElementById('status-msg');
    statusMsg.textContent = "⏳ Đang tải dữ liệu từ kho...";
    statusMsg.style.color = "orange";

    Papa.parse(CSV_URL, {
        download: true,
        header: true,
        complete: function(results) {
            inventoryData = results.data;
            statusMsg.innerHTML = `✅ Đã tải <b>${inventoryData.length}</b> dòng dữ liệu.<br>Sẵn sàng quét mã.`;
            statusMsg.style.color = "green";
            document.getElementById('btn-start-scan').disabled = false;
        },
        error: function(err) {
            statusMsg.textContent = "❌ Lỗi kết nối! Vui lòng tải lại trang.";
            statusMsg.style.color = "red";
        }
    });
}

// 2. Hàm Bật Camera (Đã nâng cấp để ép mở Camera sau)
function startCamera() {
    // Ẩn nút Start, hiện khung Camera
    document.getElementById('scanner-wrapper').classList.remove('hidden');
    document.getElementById('result-card').classList.add('hidden');
    document.getElementById('status-msg').textContent = "📷 Đang khởi động Camera...";

    // Sử dụng Class Html5Qrcode (Cấp thấp hơn nhưng mạnh hơn)
    // Lưu ý: "reader" là ID của thẻ div trong HTML
    if (!html5QrCode) {
        html5QrCode = new Html5Qrcode("reader");
    }

    const config = { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
    };

    // Lệnh quan trọng: facingMode: "environment" nghĩa là Camera Sau
    html5QrCode.start(
        { facingMode: "environment" }, 
        config, 
        onScanSuccess, 
        onScanFailure
    ).catch(err => {
        // Bắt lỗi nếu không mở được camera
        console.error("Lỗi Camera:", err);
        document.getElementById('status-msg').textContent = "❌ Không thể mở Camera. Hãy cấp quyền truy cập!";
        document.getElementById('status-msg').style.color = "red";
        alert("Lỗi: Trình duyệt không cho phép mở Camera. Vui lòng kiểm tra lại quyền trong Cài đặt.");
        
        // Ẩn khung camera đi nếu lỗi
        document.getElementById('scanner-wrapper').classList.add('hidden');
    });
}

// 3. Hàm Dừng Camera
function stopCamera() {
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            document.getElementById('scanner-wrapper').classList.add('hidden');
            document.getElementById('status-msg').innerHTML = `✅ Đã tải <b>${inventoryData.length}</b> sản phẩm. Sẵn sàng.`;
        }).catch(err => {
            console.log("Stop failed ", err);
            // Nếu lỗi stop (do chưa start xong), cứ ẩn đi
            document.getElementById('scanner-wrapper').classList.add('hidden');
        });
    }
}

// 4. Xử lý khi quét thành công
function onScanSuccess(decodedText, decodedResult) {
    stopCamera(); // Tắt camera ngay
    beepSound.play().catch(e => console.log("Audio blocked"));
    lookupProduct(decodedText);
}

function onScanFailure(error) {
    // Bỏ qua lỗi quét trượt để đỡ lag
}

// 5. Hàm tìm kiếm
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
        document.getElementById('status-msg').innerHTML = `✅ Sẵn sàng quét mã khác.`;
    }
}

function displayResult(code, name, total) {
    document.getElementById('result-card').classList.remove('hidden');
    document.getElementById('res-code').textContent = code;
    document.getElementById('res-name').textContent = name;
    document.getElementById('res-total').textContent = total;
}

window.onload = loadInventoryData;