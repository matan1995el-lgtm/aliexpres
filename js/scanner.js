// ===== QR & Barcode Scanner =====

class Scanner {
    constructor() {
        this.qrStream = null;
        this.barcodeStream = null;
        this.qrAnimationFrame = null;
        this.barcodeAnimationFrame = null;
    }

    // ===== QR Scanner =====
    async startQRScanner() {
        try {
            const video = document.getElementById('qrVideo');
            
            this.qrStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            
            video.srcObject = this.qrStream;
            video.play();
            
            this.scanQRCode(video);
            showToast('המצלמה פעילה - סרוק QR', 'success');
        } catch (error) {
            console.error('QR Scanner Error:', error);
            showToast('שגיאה בגישה למצלמה', 'error');
        }
    }

    scanQRCode(video) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        const scan = () => {
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                
                if (typeof jsQR !== 'undefined') {
                    const code = jsQR(imageData.data, imageData.width, imageData.height);
                    
                    if (code) {
                        this.handleQRResult(code.data);
                        return;
                    }
                }
            }
            
            this.qrAnimationFrame = requestAnimationFrame(scan);
        };
        
        scan();
    }

    handleQRResult(data) {
        this.stopQRScanner();
        
        const resultDiv = document.getElementById('scannerResult');
        const dataDiv = document.getElementById('scannedData');
        
        dataDiv.textContent = data;
        resultDiv.style.display = 'block';
        
        // Check if it's a URL
        if (data.startsWith('http')) {
            setTimeout(() => {
                if (confirm('האם לפתוח את הקישור?')) {
                    window.open(data, '_blank');
                }
                this.closeQRScanner();
            }, 1000);
        } else {
            showToast('QR נסרק בהצלחה!', 'success');
        }
    }

    stopQRScanner() {
        if (this.qrStream) {
            this.qrStream.getTracks().forEach(track => track.stop());
            this.qrStream = null;
        }
        
        if (this.qrAnimationFrame) {
            cancelAnimationFrame(this.qrAnimationFrame);
            this.qrAnimationFrame = null;
        }
        
        const video = document.getElementById('qrVideo');
        if (video) {
            video.srcObject = null;
        }
    }

    closeQRScanner() {
        this.stopQRScanner();
        document.getElementById('qrScannerModal').classList.remove('active');
        document.getElementById('scannerResult').style.display = 'none';
    }

    // ===== Barcode Scanner =====
    async startBarcodeScanner() {
        try {
            const video = document.getElementById('barcodeVideo');
            
            this.barcodeStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            
            video.srcObject = this.barcodeStream;
            video.play();
            
            this.scanBarcode(video);
            showToast('המצלמה פעילה - סרוק ברקוד', 'success');
        } catch (error) {
            console.error('Barcode Scanner Error:', error);
            showToast('שגיאה בגישה למצלמה', 'error');
        }
    }

    scanBarcode(video) {
        const canvas = document.getElementById('barcodeCanvas');
        const context = canvas.getContext('2d');
        
        const scan = () => {
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                
                // Try to detect barcode with jsQR (it can also detect some 1D barcodes)
                if (typeof jsQR !== 'undefined') {
                    const code = jsQR(imageData.data, imageData.width, imageData.height);
                    
                    if (code) {
                        this.handleBarcodeResult(code.data);
                        return;
                    }
                }
            }
            
            this.barcodeAnimationFrame = requestAnimationFrame(scan);
        };
        
        scan();
    }

    handleBarcodeResult(barcode) {
        this.stopBarcodeScanner();
        
        const resultDiv = document.getElementById('barcodeResult');
        const valueSpan = document.getElementById('barcodeValue');
        
        valueSpan.textContent = barcode;
        resultDiv.style.display = 'block';
        
        showToast('ברקוד נסרק בהצלחה!', 'success');
        
        // Search on AliExpress via Google
        setTimeout(() => {
            const searchQuery = encodeURIComponent(`site:aliexpress.com ${barcode}`);
            const googleUrl = `https://www.google.com/search?q=${searchQuery}`;
            
            if (confirm('האם לחפש את המוצר ב-Google?')) {
                window.open(googleUrl, '_blank');
            }
            
            setTimeout(() => {
                this.closeBarcodeScanner();
            }, 1000);
        }, 2000);
    }

    stopBarcodeScanner() {
        if (this.barcodeStream) {
            this.barcodeStream.getTracks().forEach(track => track.stop());
            this.barcodeStream = null;
        }
        
        if (this.barcodeAnimationFrame) {
            cancelAnimationFrame(this.barcodeAnimationFrame);
            this.barcodeAnimationFrame = null;
        }
        
        const video = document.getElementById('barcodeVideo');
        if (video) {
            video.srcObject = null;
        }
    }

    closeBarcodeScanner() {
        this.stopBarcodeScanner();
        document.getElementById('barcodeScannerModal').classList.remove('active');
        document.getElementById('barcodeResult').style.display = 'none';
    }
}

// Initialize scanner
const scanner = new Scanner();

// Global functions for buttons
function openQRScanner() {
    document.getElementById('qrScannerModal').classList.add('active');
}

function startQRScanner() {
    scanner.startQRScanner();
}

function stopQRScanner() {
    scanner.stopQRScanner();
}

function closeQRScanner() {
    scanner.closeQRScanner();
}

function openBarcodeScanner() {
    document.getElementById('barcodeScannerModal').classList.add('active');
}

function startBarcodeScanner() {
    scanner.startBarcodeScanner();
}

function stopBarcodeScanner() {
    scanner.stopBarcodeScanner();
}

function closeBarcodeScanner() {
    scanner.closeBarcodeScanner();
}

// ===== QR Code Generation =====
function generateProductQR(productLink) {
    const modal = document.getElementById('qrDisplayModal');
    const qrContainer = document.getElementById('productQRCode');
    
    qrContainer.innerHTML = '';
    
    if (typeof QRCode !== 'undefined') {
        new QRCode(qrContainer, {
            text: productLink,
            width: 256,
            height: 256,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });
        
        modal.classList.add('active');
    } else {
        showToast('QRCode library not loaded', 'error');
    }
}

function closeQRDisplay() {
    document.getElementById('qrDisplayModal').classList.remove('active');
}

function downloadQRCode() {
    const qrCanvas = document.querySelector('#productQRCode canvas');
    if (qrCanvas) {
        const link = document.createElement('a');
        link.download = `product-qr-${Date.now()}.png`;
        link.href = qrCanvas.toDataURL();
        link.click();
        showToast('QR הורד בהצלחה!', 'success');
    }
}

// ===== Share Functions =====
let currentShareProduct = null;

function openShareModal(product) {
    currentShareProduct = product;
    const modal = document.getElementById('shareModal');
    
    // Generate QR for share
    const qrContainer = document.getElementById('shareQRCode');
    qrContainer.innerHTML = '';
    
    if (typeof QRCode !== 'undefined') {
        new QRCode(qrContainer, {
            text: product.link,
            width: 128,
            height: 128,
            colorDark: '#000000',
            colorLight: '#ffffff'
        });
    }
    
    modal.classList.add('active');
}

function closeShareModal() {
    document.getElementById('shareModal').classList.remove('active');
    currentShareProduct = null;
}

function shareViaWhatsApp() {
    if (!currentShareProduct) return;
    
    const text = `✨ מצאתי מוצר מעולה ב-AliExpress!\n\n${currentShareProduct.name}\n💰 מחיר: $${currentShareProduct.price}\n⭐ דירוג: ${currentShareProduct.rating}\n\n🔗 ${currentShareProduct.link}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
}

function shareViaTelegram() {
    if (!currentShareProduct) return;
    
    const text = `✨ מצאתי מוצר מעולה ב-AliExpress!\n\n${currentShareProduct.name}\n💰 מחיר: $${currentShareProduct.price}\n⭐ דירוג: ${currentShareProduct.rating}\n\n🔗 ${currentShareProduct.link}`;
    const url = `https://t.me/share/url?url=${encodeURIComponent(currentShareProduct.link)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
}

function shareViaEmail() {
    if (!currentShareProduct) return;
    
    const subject = `בדוק את המוצר הזה: ${currentShareProduct.name}`;
    const body = `היי!\n\nמצאתי מוצר מעניין ב-AliExpress:\n\n${currentShareProduct.name}\n\nמחיר: $${currentShareProduct.price}\nדירוג: ${currentShareProduct.rating}\n\nקישור: ${currentShareProduct.link}\n\nכדאי לבדוק!`;
    
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
}

function copyShareLink() {
    if (!currentShareProduct) return;
    
    navigator.clipboard.writeText(currentShareProduct.link).then(() => {
        showToast('הקישור הועתק ללוח!', 'success');
        closeShareModal();
    }).catch(() => {
        showToast('שגיאה בהעתקה', 'error');
    });
}

// ===== Image Preview =====
function previewProductImage(imageSrc) {
    const modal = document.getElementById('imagePreviewModal');
    const img = document.getElementById('previewImage');
    
    img.src = imageSrc;
    modal.classList.add('active');
}

function closeImagePreview() {
    document.getElementById('imagePreviewModal').classList.remove('active');
}

// ===== FAB Menu =====
function toggleFabMenu() {
    const menu = document.getElementById('fabMenu');
    menu.classList.toggle('active');
}

// Close FAB menu when clicking outside
document.addEventListener('click', (e) => {
    const fabContainer = document.querySelector('.fab-container');
    if (fabContainer && !fabContainer.contains(e.target)) {
        document.getElementById('fabMenu')?.classList.remove('active');
    }
});
