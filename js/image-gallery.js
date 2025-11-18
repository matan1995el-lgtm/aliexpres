// ===== Image Gallery System =====
// גלריית תמונות מתקדמת עם סליידר, זום ומספר תמונות

class ImageGallery {
    constructor() {
        this.currentIndex = 0;
        this.images = [];
        this.zoomLevel = 1;
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.translateX = 0;
        this.translateY = 0;
    }

    // פתיחת גלריה
    open(images, startIndex = 0) {
        this.images = Array.isArray(images) ? images : [images];
        this.currentIndex = startIndex;
        this.zoomLevel = 1;
        this.translateX = 0;
        this.translateY = 0;

        this.render();
        this.initControls();
        
        // חסום scroll של הגוף
        document.body.style.overflow = 'hidden';
    }

    // סגירת גלריה
    close() {
        const modal = document.getElementById('imageGalleryModal');
        if (modal) {
            modal.remove();
        }
        document.body.style.overflow = '';
    }

    // רינדור הגלריה
    render() {
        const existingModal = document.getElementById('imageGalleryModal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'imageGalleryModal';
        modal.className = 'image-gallery-modal';
        modal.innerHTML = `
            <div class="gallery-overlay" onclick="imageGallery.close()"></div>
            <div class="gallery-container">
                <!-- כפתור סגירה -->
                <button class="gallery-close" onclick="imageGallery.close()" aria-label="סגור">
                    <i class="fas fa-times"></i>
                </button>

                <!-- מונה תמונות -->
                <div class="gallery-counter">
                    ${this.currentIndex + 1} / ${this.images.length}
                </div>

                <!-- תמונה ראשית -->
                <div class="gallery-image-container" id="galleryImageContainer">
                    <img 
                        src="${this.images[this.currentIndex]}" 
                        alt="תמונה ${this.currentIndex + 1}"
                        id="galleryMainImage"
                        class="gallery-main-image"
                    >
                </div>

                <!-- כפתורי ניווט -->
                ${this.images.length > 1 ? `
                    <button class="gallery-nav gallery-prev" onclick="imageGallery.prev()" aria-label="קודם">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                    <button class="gallery-nav gallery-next" onclick="imageGallery.next()" aria-label="הבא">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                ` : ''}

                <!-- בקרות זום -->
                <div class="gallery-controls">
                    <button onclick="imageGallery.zoomIn()" aria-label="זום פנימה" title="זום פנימה (+)">
                        <i class="fas fa-search-plus"></i>
                    </button>
                    <button onclick="imageGallery.zoomOut()" aria-label="זום החוצה" title="זום החוצה (-)">
                        <i class="fas fa-search-minus"></i>
                    </button>
                    <button onclick="imageGallery.resetZoom()" aria-label="אפס זום" title="אפס זום (0)">
                        <i class="fas fa-compress-arrows-alt"></i>
                    </button>
                    <button onclick="imageGallery.rotateLeft()" aria-label="סובב שמאלה" title="סובב שמאלה ([)">
                        <i class="fas fa-undo"></i>
                    </button>
                    <button onclick="imageGallery.rotateRight()" aria-label="סובב ימינה" title="סובב ימינה (])">
                        <i class="fas fa-redo"></i>
                    </button>
                    <button onclick="imageGallery.downloadImage()" aria-label="הורד תמונה" title="הורד תמונה (D)">
                        <i class="fas fa-download"></i>
                    </button>
                </div>

                <!-- תמונות ממוזערות -->
                ${this.images.length > 1 ? `
                    <div class="gallery-thumbnails" id="galleryThumbnails">
                        ${this.images.map((img, index) => `
                            <div class="gallery-thumbnail ${index === this.currentIndex ? 'active' : ''}" 
                                 onclick="imageGallery.goToImage(${index})">
                                <img src="${img}" alt="תמונה ${index + 1}">
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;

        document.body.appendChild(modal);

        // אנימציית פתיחה
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
    }

    // אתחול בקרות
    initControls() {
        const container = document.getElementById('galleryImageContainer');
        const image = document.getElementById('galleryMainImage');
        
        if (!container || !image) return;

        // Keyboard controls
        this.keyboardHandler = (e) => {
            switch(e.key) {
                case 'Escape':
                    this.close();
                    break;
                case 'ArrowLeft':
                    this.next();
                    break;
                case 'ArrowRight':
                    this.prev();
                    break;
                case '+':
                case '=':
                    this.zoomIn();
                    break;
                case '-':
                case '_':
                    this.zoomOut();
                    break;
                case '0':
                    this.resetZoom();
                    break;
                case '[':
                    this.rotateLeft();
                    break;
                case ']':
                    this.rotateRight();
                    break;
                case 'd':
                case 'D':
                    this.downloadImage();
                    break;
            }
        };

        document.addEventListener('keydown', this.keyboardHandler);

        // Mouse wheel zoom
        container.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY < 0) {
                this.zoomIn();
            } else {
                this.zoomOut();
            }
        }, { passive: false });

        // Drag to pan (when zoomed)
        image.addEventListener('mousedown', (e) => {
            if (this.zoomLevel > 1) {
                this.isDragging = true;
                this.startX = e.clientX - this.translateX;
                this.startY = e.clientY - this.translateY;
                image.style.cursor = 'grabbing';
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                this.translateX = e.clientX - this.startX;
                this.translateY = e.clientY - this.startY;
                this.updateImageTransform();
            }
        });

        document.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                const image = document.getElementById('galleryMainImage');
                if (image) image.style.cursor = this.zoomLevel > 1 ? 'grab' : 'default';
            }
        });

        // Touch support
        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartDistance = 0;

        container.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            } else if (e.touches.length === 2) {
                // Pinch to zoom
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                touchStartDistance = Math.sqrt(dx * dx + dy * dy);
            }
        });

        container.addEventListener('touchmove', (e) => {
            e.preventDefault();
            
            if (e.touches.length === 2 && touchStartDistance) {
                // Pinch zoom
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const scale = distance / touchStartDistance;
                
                this.zoomLevel = Math.max(0.5, Math.min(5, this.zoomLevel * scale));
                touchStartDistance = distance;
                this.updateImageTransform();
            }
        }, { passive: false });

        container.addEventListener('touchend', (e) => {
            if (e.touches.length < 2) {
                touchStartDistance = 0;
            }
        });
    }

    // ניווט
    next() {
        this.currentIndex = (this.currentIndex + 1) % this.images.length;
        this.resetZoom();
        this.updateImage();
    }

    prev() {
        this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
        this.resetZoom();
        this.updateImage();
    }

    goToImage(index) {
        this.currentIndex = index;
        this.resetZoom();
        this.updateImage();
    }

    // עדכון תמונה
    updateImage() {
        const image = document.getElementById('galleryMainImage');
        const counter = document.querySelector('.gallery-counter');
        const thumbnails = document.querySelectorAll('.gallery-thumbnail');

        if (image) {
            image.src = this.images[this.currentIndex];
            image.alt = `תמונה ${this.currentIndex + 1}`;
        }

        if (counter) {
            counter.textContent = `${this.currentIndex + 1} / ${this.images.length}`;
        }

        thumbnails.forEach((thumb, index) => {
            thumb.classList.toggle('active', index === this.currentIndex);
        });
    }

    // זום
    zoomIn() {
        this.zoomLevel = Math.min(5, this.zoomLevel + 0.25);
        this.updateImageTransform();
        const image = document.getElementById('galleryMainImage');
        if (image && this.zoomLevel > 1) {
            image.style.cursor = 'grab';
        }
    }

    zoomOut() {
        this.zoomLevel = Math.max(0.5, this.zoomLevel - 0.25);
        if (this.zoomLevel === 1) {
            this.translateX = 0;
            this.translateY = 0;
        }
        this.updateImageTransform();
        const image = document.getElementById('galleryMainImage');
        if (image && this.zoomLevel <= 1) {
            image.style.cursor = 'default';
        }
    }

    resetZoom() {
        this.zoomLevel = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.rotation = 0;
        this.updateImageTransform();
        const image = document.getElementById('galleryMainImage');
        if (image) image.style.cursor = 'default';
    }

    // סיבוב
    rotateLeft() {
        this.rotation = (this.rotation || 0) - 90;
        this.updateImageTransform();
    }

    rotateRight() {
        this.rotation = (this.rotation || 0) + 90;
        this.updateImageTransform();
    }

    // עדכון transform
    updateImageTransform() {
        const image = document.getElementById('galleryMainImage');
        if (!image) return;

        const transform = `
            scale(${this.zoomLevel})
            translate(${this.translateX / this.zoomLevel}px, ${this.translateY / this.zoomLevel}px)
            rotate(${this.rotation || 0}deg)
        `;
        
        image.style.transform = transform;
    }

    // הורדת תמונה
    async downloadImage() {
        try {
            const imageUrl = this.images[this.currentIndex];
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `product-image-${this.currentIndex + 1}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            showToast('התמונה הורדה בהצלחה!', 'success');
        } catch (error) {
            console.error('Error downloading image:', error);
            showToast('שגיאה בהורדת התמונה', 'error');
        }
    }

    // ניקוי
    destroy() {
        document.removeEventListener('keydown', this.keyboardHandler);
        this.close();
    }
}

// יצירת instance גלובלי
const imageGallery = new ImageGallery();

// פונקציה עזר לפתיחת גלריה
function openImageGallery(images, startIndex = 0) {
    imageGallery.open(images, startIndex);
}

// ייצוא
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageGallery;
}
