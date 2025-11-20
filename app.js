// Version 4.0 - Logic Nimiq QR Scanner (Ưu tiên tốc độ)
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSPhZG8XeQtXDs_9KahSED37StkvPTPZUlGNjfv7eBIvqurKoMLSCl3lhzFLS45h96YqP5C3buifgCc/pub?output=csv';

let inventoryData = [];
let qrScanner = null;
const beepSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3');

// 1. Tải dữ liệu
function loadInventoryData() {
    const statusMsg = document.getElementById('status-msg');
    statusMsg.textContent = "⏳ Đang tải dữ liệu...";
    statusMsg.style.color = "orange";

    Papa.parse(CSV_URL, {
        download: true,
        header: true,
        complete: function(results) {
            inventoryData = results.data;
            statusMsg.innerHTML = `✅ Đã tải <b>${inventoryData.length}</b> SP. Sẵn sàng quét QR.`;
            statusMsg.style.color = "green";
            document.getElementById('btn-start-scan').disabled = false;
        },
        error: function(err) {
            statusMsg.textContent = "❌ Lỗi tải dữ liệu.";
            statusMsg.style.color = "red";
        }
    });
}

// 2. Bắt đầu quét
function startScan() {
    // UI updates
    document.getElementById('scanner-wrapper').classList.remove('hidden');
    document.getElementById('result-card').classList.add('hidden');
    document.getElementById('status-msg').textContent = "📷 Đang mở Camera...";

    const videoElem = document.getElementById('qr-video');

    if (!qrScanner) {
        // Khởi tạo Scanner mới
        qrScanner = new QrScanner(
            videoElem,
            result => handleScan(result), // Hàm xử lý khi quét được
            {
                returnDetailedScanResult: true,
                highlightScanRegion: true, // Tô sáng vùng quét
                highlightCodeOutline: true, // Vẽ viền quanh mã QR tìm thấy
            }
        );
    }

    qrScanner.start().then(() => {
        document.getElementById('status-msg').textContent = "⚡ Đang quét mã QR...";
    }).catch(err => {
        console.error(err);
        alert("Lỗi Camera: " + err);
        stopScan();
    });
}

// 3. Xử lý kết quả
function handleScan(result) {
    const code = result.data;
    // console.log("Quét được:", code);
    
    // Dừng quét ngay lập tức để tránh quét nhiều lần
    stopScan(); 
    
    beepSound.play().catch(e => {});
    lookupProduct(code);
}

// 4. Dừng quét
function stopScan() {
    if (qrScanner) {
        qrScanner.stop();
        // Không destroy, chỉ stop để lần sau start cho nhanh
    }
    document.getElementById('scanner-wrapper').classList.add('hidden');
    document.getElementById('status-msg').innerHTML = `✅ Sẵn sàng quét tiếp.`;
}

// 5. Tìm kiếm và hiển thị (Logic cũ)
function lookupProduct(code) {
    // Vì mã QR có thể chứa text lạ, ta cần trim kỹ
    const cleanCode = code.trim();

    const products = inventoryData.filter(row => 
        row['Mã sản phẩm'] && row['Mã sản phẩm'].trim() === cleanCode
    );

    if (products.length > 0) {
        const productName = products[0]['Tên sản phẩm'];
        const totalQuantity = products.reduce((sum, row) => {
            let qty = parseInt(row['Số lượng']);
            return sum + (isNaN(qty) ? 0 : qty);
        }, 0);
        displayResult(cleanCode, productName, totalQuantity);
    } else {
        alert(`⚠️ Không tìm thấy SP có mã: ${cleanCode}`);
    }
}

function displayResult(code, name, total) {
    document.getElementById('result-card').classList.remove('hidden');
    document.getElementById('res-code').textContent = code;
    document.getElementById('res-name').textContent = name;
    document.getElementById('res-total').textContent = total;
}

window.onload = loadInventoryData;