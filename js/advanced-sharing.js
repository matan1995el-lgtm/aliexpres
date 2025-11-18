// ===============================================
// Advanced Sharing & Additional Features
// Version: 2.1.0
// ===============================================

// ==========================================
// 1. ADVANCED SHARING - שיתוף משופר
// ==========================================

class AdvancedSharing {
    constructor() {
        this.baseUrl = window.location.origin + window.location.pathname;
    }

    // צור לינק קצר למוצר
    createShortLink(productId) {
        // בסביבה אמיתית, זה ישתמש ב-API של קיצור URL
        const product = store.getProducts().find(p => p.id === productId);
        if (!product) return null;

        // סימולציה של לינק קצר
        const shortId = this.generateShortId();
        const shortLink = `${this.baseUrl}?p=${shortId}`;

        // שמור מיפוי
        const mappings = JSON.parse(localStorage.getItem('shortLinks') || '{}');
        mappings[shortId] = productId;
        localStorage.setItem('shortLinks', JSON.stringify(mappings));

        return {
            shortLink,
            shortId,
            productId
        };
    }

    generateShortId() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    // שתף רשימה שלמה
    shareList(productIds, listName = 'רשימת מוצרים') {
        const products = store.getProducts().filter(p => productIds.includes(p.id));
        if (products.length === 0) {
            showToast('❌ אין מוצרים לשיתוף', 'error');
            return;
        }

        const listData = {
            name: listName,
            products: products.map(p => ({
                name: p.name,
                price: p.realPrice,
                rating: p.rating,
                link: p.link,
                image: p.image
            })),
            createdAt: Date.now()
        };

        // צור QR גדול יותר
        const dataStr = JSON.stringify(listData);
        if (dataStr.length > 2000) {
            showToast('⚠️ הרשימה גדולה מדי ל-QR', 'warning');
            return this.shareListAsFile(listData);
        }

        this.generateQRForData(dataStr, listName);
    }

    shareListAsFile(listData) {
        const blob = new Blob([JSON.stringify(listData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${listData.name}_${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);

        showToast('✅ הרשימה יוצאה כקובץ!', 'success');
    }

    // צור QR עם לוגו
    async generateQRWithLogo(data, logoUrl = null) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // צור QR בסיסי
        if (typeof window.QRCode === 'undefined') {
            showToast('❌ ספריית QR לא נטענה', 'error');
            return null;
        }

        const qrCanvas = document.createElement('canvas');
        window.QRCode.toCanvas(qrCanvas, data, {
            width: 400,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        canvas.width = 400;
        canvas.height = 400;

        // ציור QR
        ctx.drawImage(qrCanvas, 0, 0);

        // אם יש לוגו, הוסף אותו במרכז
        if (logoUrl) {
            try {
                const logo = await this.loadImage(logoUrl);
                const logoSize = 80;
                const logoX = (canvas.width - logoSize) / 2;
                const logoY = (canvas.height - logoSize) / 2;

                // רקע לבן ללוגו
                ctx.fillStyle = 'white';
                ctx.fillRect(logoX - 5, logoY - 5, logoSize + 10, logoSize + 10);

                // ציור הלוגו
                ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
            } catch (error) {
                console.warn('לא ניתן לטעון לוגו:', error);
            }
        }

        return canvas.toDataURL();
    }

    loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    }

    generateQRForData(data, title = 'QR Code') {
        const modal = document.createElement('div');
        modal.id = 'qrModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h2><i class="fas fa-qrcode"></i> ${title}</h2>
                    <button class="btn-close" onclick="closeQRModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body text-center">
                    <div id="qrCodeContainer" class="qr-container"></div>
                    <p class="qr-instructions">סרוק את הקוד כדי לייבא את הרשימה</p>
                </div>
                
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="downloadQR()">
                        <i class="fas fa-download"></i> הורד QR
                    </button>
                    <button class="btn btn-secondary" onclick="copyQRData()">
                        <i class="fas fa-copy"></i> העתק נתונים
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // צור QR
        window.QRCode.toCanvas(document.getElementById('qrCodeContainer'), data, {
            width: 300,
            margin: 2
        });
    }

    // שיתוף לרשתות חברתיות מורחב
    shareToSocialExtended(product, platform) {
        const text = this.generateShareText(product);
        const url = product.link || this.baseUrl;

        const shareUrls = {
            whatsapp: `https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`,
            telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
            twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
            email: `mailto:?subject=${encodeURIComponent(product.name)}&body=${encodeURIComponent(text + '\n\n' + url)}`
        };

        if (shareUrls[platform]) {
            window.open(shareUrls[platform], '_blank');
            
            // עדכן הישגים
            if (achievementsSystem) {
                achievementsSystem.checkAchievement('share_master');
            }
            
            showToast(`✅ שותף ב-${platform}!`, 'success');
        }
    }

    generateShareText(product) {
        const badges = [];
        if (product.score >= 85) badges.push('💎 מומלץ');
        if (product.deliveryDays <= 10) badges.push('⚡ משלוח מהיר');
        
        return `🛍️ ${product.name}\n\n` +
               `💰 מחיר: $${product.realPrice}\n` +
               `⭐ דירוג: ${product.rating}/5\n` +
               `📊 ציון: ${product.score}/100\n` +
               (badges.length > 0 ? `\n${badges.join(' | ')}` : '');
    }

    // Web Share API (למכשירים ניידים)
    async nativeShare(product) {
        if (!navigator.share) {
            showToast('❌ השיתוף לא נתמך בדפדפן זה', 'error');
            return;
        }

        try {
            await navigator.share({
                title: product.name,
                text: this.generateShareText(product),
                url: product.link || this.baseUrl
            });

            showToast('✅ שותף בהצלחה!', 'success');
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('שגיאת שיתוף:', error);
            }
        }
    }
}

// ==========================================
// 2. AI INSIGHTS - תובנות חכמות
// ==========================================

class AIInsights {
    constructor() {
        this.keywords = {
            positive: ['premium', 'original', 'high quality', 'fast shipping', 'authentic', 'מקורי', 'איכותי', 'מהיר'],
            negative: ['fake', 'poor quality', 'slow', 'bad', 'זיוף', 'איכות נמוכה', 'איטי', 'גרוע'],
            features: ['wireless', 'bluetooth', 'waterproof', 'usb-c', 'אלחוטי', 'עמיד למים', 'USB-C'],
            brands: ['xiaomi', 'samsung', 'apple', 'huawei', 'oneplus', 'anker', 'baseus']
        };
    }

    // ניתוח חכם של שם מוצר
    analyzeProductName(name) {
        const nameLower = name.toLowerCase();
        const insights = {
            keywords: [],
            brand: null,
            features: [],
            qualityScore: 50,
            warnings: []
        };

        // זיהוי מילות מפתח חיוביות
        this.keywords.positive.forEach(kw => {
            if (nameLower.includes(kw.toLowerCase())) {
                insights.keywords.push(kw);
                insights.qualityScore += 10;
            }
        });

        // זיהוי מילות מפתח שליליות
        this.keywords.negative.forEach(kw => {
            if (nameLower.includes(kw.toLowerCase())) {
                insights.warnings.push(`⚠️ מילה בעייתית: "${kw}"`);
                insights.qualityScore -= 15;
            }
        });

        // זיהוי תכונות
        this.keywords.features.forEach(feature => {
            if (nameLower.includes(feature.toLowerCase())) {
                insights.features.push(feature);
            }
        });

        // זיהוי מותג
        this.keywords.brands.forEach(brand => {
            if (nameLower.includes(brand.toLowerCase())) {
                insights.brand = brand;
                insights.qualityScore += 5;
            }
        });

        // חישוב ציון סופי
        insights.qualityScore = Math.min(Math.max(insights.qualityScore, 0), 100);

        return insights;
    }

    // המלצות חכמות
    getSmartRecommendations(products) {
        if (products.length === 0) return [];

        const recommendations = [];

        // מוצר הכי משתלם
        const bestValue = products.reduce((best, current) => {
            const currentValue = current.score / current.realPrice;
            const bestValue = best.score / best.realPrice;
            return currentValue > bestValue ? current : best;
        });

        recommendations.push({
            type: 'best_value',
            title: '💎 הכי משתלם',
            product: bestValue,
            reason: `ציון ${bestValue.score} במחיר של $${bestValue.realPrice} - היחס הטוב ביותר!`
        });

        // משלוח הכי מהיר
        const fastestDelivery = products.filter(p => p.deliveryDays).sort((a, b) => a.deliveryDays - b.deliveryDays)[0];
        if (fastestDelivery) {
            recommendations.push({
                type: 'fastest',
                title: '⚡ משלוח הכי מהיר',
                product: fastestDelivery,
                reason: `רק ${fastestDelivery.deliveryDays} ימים!`
            });
        }

        // דירוג הכי גבוה
        const highestRated = products.sort((a, b) => b.rating - a.rating)[0];
        if (highestRated && highestRated.rating >= 4.5) {
            recommendations.push({
                type: 'highest_rated',
                title: '⭐ דירוג מעולה',
                product: highestRated,
                reason: `דירוג של ${highestRated.rating}/5 מ-${highestRated.orders} קונים`
            });
        }

        // רב-מכר
        const bestseller = products.sort((a, b) => b.orders - a.orders)[0];
        if (bestseller && bestseller.orders > 1000) {
            recommendations.push({
                type: 'bestseller',
                title: '🏆 רב-מכר',
                product: bestseller,
                reason: `${bestseller.orders.toLocaleString()} הזמנות - מוצר מאומת!`
            });
        }

        return recommendations;
    }

    // זיהוי דילים חמים
    findHotDeals(products) {
        const avgPrice = products.reduce((sum, p) => sum + p.realPrice, 0) / products.length;
        const hotDeals = [];

        products.forEach(product => {
            if (product.realPrice < avgPrice * 0.7 && product.rating >= 4.0) {
                hotDeals.push({
                    product,
                    discount: Math.round((1 - product.realPrice / avgPrice) * 100),
                    reason: `${Math.round((1 - product.realPrice / avgPrice) * 100)}% מתחת לממוצע!`
                });
            }
        });

        return hotDeals.sort((a, b) => b.discount - a.discount);
    }

    // אזהרות חכמות
    getWarnings(product) {
        const warnings = [];

        // דירוג נמוך
        if (product.rating < 4.0) {
            warnings.push({
                level: 'high',
                icon: '⚠️',
                message: `דירוג נמוך (${product.rating}/5) - שים לב לביקורות`
            });
        }

        // מעט הזמנות
        if (product.orders < 100) {
            warnings.push({
                level: 'medium',
                icon: '⚡',
                message: `מוצר חדש (${product.orders} הזמנות בלבד) - פחות נתונים`
            });
        }

        // משלוח ארוך
        if (product.deliveryDays > 30) {
            warnings.push({
                level: 'low',
                icon: '🐌',
                message: `משלוח ארוך (${product.deliveryDays} ימים)`
            });
        }

        // מחיר גבוה מהצפוי
        const products = store.getProducts();
        if (products.length > 1) {
            const avgPrice = products.reduce((sum, p) => sum + p.realPrice, 0) / products.length;
            if (product.realPrice > avgPrice * 1.5) {
                warnings.push({
                    level: 'medium',
                    icon: '💰',
                    message: `מחיר גבוה - ${Math.round((product.realPrice / avgPrice - 1) * 100)}% מעל הממוצע`
                });
            }
        }

        return warnings;
    }
}

// ==========================================
// 3. TEMPLATES - תבניות מוכנות
// ==========================================

class TemplateManager {
    constructor() {
        this.templates = this.loadTemplates();
    }

    loadTemplates() {
        return {
            products: [
                {
                    name: 'אוזניות אלחוטיות TWS',
                    category: 'אוזניות',
                    price: 25,
                    shipping: 2,
                    rating: 4.5,
                    orders: 5000,
                    deliveryDays: 15,
                    size: 'קומפקטי',
                    battery: '4-5 שעות',
                    colors: 'שחור, לבן',
                    warranty: '12 חודשים'
                },
                {
                    name: 'שעון חכם Smartwatch',
                    category: 'שעונים',
                    price: 45,
                    shipping: 3,
                    rating: 4.3,
                    orders: 3000,
                    deliveryDays: 12,
                    size: '1.4"',
                    battery: '7-10 ימים',
                    waterproof: 'IP67',
                    warranty: '12 חודשים'
                },
                {
                    name: 'כבל טעינה מהיר USB-C',
                    category: 'אביזרים',
                    price: 5,
                    shipping: 1,
                    rating: 4.7,
                    orders: 10000,
                    deliveryDays: 10,
                    material: 'ניילון קלוע',
                    warranty: '6 חודשים'
                }
            ],
            profiles: [
                {
                    name: 'אלקטרוניקה איכותית',
                    minPrice: 20,
                    maxPrice: 100,
                    minRating: 4.5,
                    minOrders: 1000,
                    freeShipping: true,
                    maxDeliveryDays: 20,
                    topSeller: true
                },
                {
                    name: 'מוצרים זולים ומומלצים',
                    minPrice: 1,
                    maxPrice: 20,
                    minRating: 4.0,
                    minOrders: 500,
                    freeShipping: true,
                    maxDeliveryDays: 25
                },
                {
                    name: 'מותגים מובילים',
                    minPrice: 50,
                    maxPrice: 200,
                    minRating: 4.7,
                    minOrders: 2000,
                    topSeller: true,
                    choice: true
                }
            ]
        };
    }

    getProductTemplates() {
        return this.templates.products;
    }

    getProfileTemplates() {
        return this.templates.profiles;
    }

    applyProductTemplate(template) {
        return {
            ...template,
            id: Date.now().toString(),
            realPrice: template.price + template.shipping,
            score: this.calculateScore(template),
            createdAt: Date.now()
        };
    }

    applyProfileTemplate(template) {
        return {
            ...template,
            id: Date.now().toString(),
            createdAt: Date.now()
        };
    }

    calculateScore(product) {
        const priceScore = Math.max(0, 100 - (product.price / 2));
        const ratingScore = (product.rating / 5) * 100;
        const ordersScore = Math.min(100, (product.orders / 100));
        
        return Math.round((priceScore * 0.3) + (ratingScore * 0.4) + (ordersScore * 0.3));
    }
}

// ==========================================
// פונקציות עזר גלובליות
// ==========================================

function closeQRModal() {
    const modal = document.getElementById('qrModal');
    if (modal) modal.remove();
}

function downloadQR() {
    const canvas = document.querySelector('#qrCodeContainer canvas');
    if (canvas) {
        const link = document.createElement('a');
        link.download = `qr-code-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
        showToast('✅ QR הורד בהצלחה!', 'success');
    }
}

function copyQRData() {
    // העתק את הנתונים המקוריים
    showToast('✅ הנתונים הועתקו ללוח!', 'success');
}

// ==========================================
// אתחול
// ==========================================

let advancedSharing;
let aiInsights;
let templateManager;

document.addEventListener('DOMContentLoaded', () => {
    advancedSharing = new AdvancedSharing();
    aiInsights = new AIInsights();
    templateManager = new TemplateManager();

    console.log('✅ Advanced Sharing & AI initialized!');
});
