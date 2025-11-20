// Version 3.0 - Fix Logo & Tối ưu khung quét Barcode
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSPhZG8XeQtXDs_9KahSED37StkvPTPZUlGNjfv7eBIvqurKoMLSCl3lhzFLS45h96YqP5C3buifgCc/pub?output=csv';

let inventoryData = [];
let html5QrCode = null;
const beepSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3');

function loadInventoryData() {
    const statusMsg = document.getElementById('status-msg');
    statusMsg.textContent = "⏳ Đang tải dữ liệu...";
    statusMsg.style.color = "orange";

    Papa.parse(CSV_URL, {
        download: true,
        header: true,
        complete: function(results) {
            inventoryData = results.data;
            statusMsg.innerHTML = `✅ Đã tải <b>${inventoryData.length}</b> sản phẩm.<br>Sẵn sàng.`;
            statusMsg.style.color = "green";
            document.getElementById('btn-start-scan').disabled = false;
        },
        error: function(err) {
            statusMsg.textContent = "❌ Lỗi kết nối!";
            statusMsg.style.color = "red";
        }
    });
}

function startCamera() {
    document.getElementById('scanner-wrapper').classList.remove('hidden');
    document.getElementById('result-card').classList.add('hidden');
    document.getElementById('status-msg').textContent = "📷 Đang mở camera...";

    if (!html5QrCode) {
        html5QrCode = new Html5Qrcode("reader");
    }

    // CẤU HÌNH MỚI: QUAN TRỌNG
    const config = { 
        fps: 20, // Tăng tốc độ quét lên 20 khung hình/giây (nhạy hơn)
        qrbox: { width: 320, height: 150 }, // Hình chữ nhật ngang: Dễ quét Barcode hơn
        // aspectRatio: 1.0 // Tôi đã bỏ dòng này để camera tự tràn màn hình điện thoại
    };

    html5QrCode.start(
        { facingMode: "environment" }, 
        config, 
        onScanSuccess, 
        onScanFailure
    ).catch(err => {
        console.error("Lỗi Camera:", err);
        document.getElementById('status-msg').textContent = "❌ Lỗi quyền Camera.";
        alert("Vui lòng cấp quyền Camera!");
        document.getElementById('scanner-wrapper').classList.add('hidden');
    });
}

function stopCamera() {
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            document.getElementById('scanner-wrapper').classList.add('hidden');
            document.getElementById('status-msg').innerHTML = `✅ Sẵn sàng quét tiếp.`;
        }).catch(err => {
            console.log("Stop failed ", err);
            document.getElementById('scanner-wrapper').classList.add('hidden');
        });
    }
}

function onScanSuccess(decodedText, decodedResult) {
    stopCamera(); 
    beepSound.play().catch(e => console.log("Audio blocked"));
    lookupProduct(decodedText);
}

function onScanFailure(error) {
    // Bỏ qua lỗi
}

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
        alert(`⚠️ Không tìm thấy: ${code}`);
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