// ===== ENHANCED FEATURES FOR ALIEXPRESS TRACKER =====

// ===== Star Rating Generator =====
function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let html = '<span class="star-rating">';
    html += '<span class="star-full">★</span>'.repeat(fullStars);
    if (hasHalfStar) html += '<span class="star-half">⯨</span>';
    html += '<span class="star-empty">☆</span>'.repeat(emptyStars);
    html += ` ${rating.toFixed(1)}</span>`;
    
    return html;
}

// ===== Generate Product Badges =====
function generateBadges(product) {
    const badges = [];
    const products = store.getProducts();
    const avgPrice = products.length > 0 ? 
        products.reduce((sum, p) => sum + p.realPrice, 0) / products.length : 0;
    
    // Hot Deal
    if (avgPrice && product.realPrice < avgPrice * 0.8) {
        badges.push('<span class="badge badge-hot">🔥 מבצע חם</span>');
    }
    
    // Fast Delivery
    if (product.deliveryDays && product.deliveryDays <= 10) {
        badges.push('<span class="badge badge-fast">⚡ משלוח מהיר</span>');
    }
    
    // Recommended
    if (product.score >= 85) {
        badges.push('<span class="badge badge-recommended">💎 מומלץ</span>');
    }
    
    // Bestseller
    if (product.orders >= 5000) {
        badges.push('<span class="badge badge-bestseller">🏆 רב מכר</span>');
    }
    
    // Warning
    if (product.rating < 4 || product.orders < 100) {
        badges.push('<span class="badge badge-warning">⚠️ זהירות</span>');
    }
    
    // New product
    const daysSinceAdded = (Date.now() - new Date(product.createdAt)) / (1000 * 60 * 60 * 24);
    if (daysSinceAdded < 7) {
        badges.push('<span class="badge badge-new">🆕 חדש</span>');
    }
    
    return badges.length > 0 ? `<div class="product-badges">${badges.join('')}</div>` : '';
}

// ===== Customs Calculator Display =====
function showCustomsInfo(product) {
    const customs = store.calculateCustoms(parseFloat(product.price), parseFloat(product.shippingCost || 0));
    
    if (!customs.hasTax) {
        return `<div class="customs-info">
            <h4><i class="fas fa-check-circle"></i> ללא מכס!</h4>
            <p>המוצר מתחת לסף ה-$75</p>
            <div class="customs-total">מחיר סופי: ₪${customs.totalILS.toFixed(2)}</div>
        </div>`;
    }
    
    return `<div class="customs-info">
        <h4><i class="fas fa-calculator"></i> מחיר כולל מכס ומע"מ</h4>
        <div class="customs-breakdown">
            <div class="customs-row">
                <span>מוצר + משלוח:</span>
                <span>$${customs.subtotal.toFixed(2)}</span>
            </div>
            <div class="customs-row">
                <span>מע"מ (17%):</span>
                <span>$${customs.vat.toFixed(2)}</span>
            </div>
            <div class="customs-row">
                <span>מכס (12%):</span>
                <span>$${customs.customs.toFixed(2)}</span>
            </div>
            <div class="customs-total">
                <span>סה"כ:</span>
                <span>₪${customs.totalILS.toFixed(2)}</span>
            </div>
        </div>
    </div>`;
}

// ===== Reports Page Rendering =====
function renderReportsPage() {
    const products = store.getProducts();
    const favorites = store.getFavorites();
    const settings = store.getSettings();
    const exchangeRate = parseFloat(settings.exchangeRate || 3.7);
    
    // Calculate savings
    const totalSavings = store.getTotalSavings();
    const savingsEl = document.getElementById('totalSavings');
    if (savingsEl) {
        savingsEl.textContent = `₪${(totalSavings * exchangeRate).toFixed(2)}`;
    }
    
    // Purchased count
    const purchasedCount = products.filter(p => p.purchased).length;
    const purchasedEl = document.getElementById('purchasedCount');
    if (purchasedEl) {
        purchasedEl.textContent = purchasedCount;
    }
    
    const totalTrackedEl = document.getElementById('totalTracked');
    if (totalTrackedEl) {
        totalTrackedEl.textContent = products.length + favorites.length;
    }
    
    // Top category
    const categoryStats = store.getCategoryStats();
    const topCategory = Object.keys(categoryStats).length > 0 ?
        Object.keys(categoryStats).reduce((a, b) => 
            categoryStats[a] > categoryStats[b] ? a : b) : 'אין';
    const topCatEl = document.getElementById('topCategory');
    if (topCatEl) {
        topCatEl.textContent = topCategory;
    }
    
    // Average rating
    const avgRating = products.length > 0 ?
        products.reduce((sum, p) => sum + parseFloat(p.rating), 0) / products.length : 0;
    const avgRatingEl = document.getElementById('avgRating');
    if (avgRatingEl) {
        avgRatingEl.textContent = avgRating.toFixed(1);
    }
    
    // Render charts
    setTimeout(() => renderReportsCharts(), 100);
    
    // Smart insights
    renderSmartInsights();
}

function renderReportsCharts() {
    const isDark = document.body.classList.contains('dark-theme');
    const textColor = isDark ? '#f1f5f9' : '#1e293b';
    const gridColor = isDark ? '#334155' : '#e2e8f0';
    
    // Category Pie Chart
    const categoryStats = store.getCategoryStats();
    const categoryCtx = document.getElementById('categoryPieChart');
    if (categoryCtx && Object.keys(categoryStats).length > 0) {
        new Chart(categoryCtx, {
            type: 'pie',
            data: {
                labels: Object.keys(categoryStats),
                datasets: [{
                    data: Object.values(categoryStats),
                    backgroundColor: [
                        '#667eea', '#f093fb', '#4ecdc4', '#ff6b6b',
                        '#ffd93d', '#6bcf7f', '#a8e6cf', '#ff8b94'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { labels: { color: textColor } }
                }
            }
        });
    }
    
    // Price Trend Chart
    const products = store.getProducts().sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
    );
    const priceTrendCtx = document.getElementById('priceTrendChart');
    if (priceTrendCtx && products.length > 0) {
        new Chart(priceTrendCtx, {
            type: 'line',
            data: {
                labels: products.map((p, i) => `מוצר ${i + 1}`),
                datasets: [{
                    label: 'מחיר ($)',
                    data: products.map(p => p.realPrice),
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { labels: { color: textColor } } },
                scales: {
                    y: { ticks: { color: textColor }, grid: { color: gridColor } },
                    x: { ticks: { color: textColor }, grid: { color: gridColor } }
                }
            }
        });
    }
    
    // Score Comparison
    const scoreCtx = document.getElementById('scoreComparisonChart');
    if (scoreCtx && products.length > 0) {
        new Chart(scoreCtx, {
            type: 'bar',
            data: {
                labels: products.map(p => p.name.substring(0, 15) + '...'),
                datasets: [{
                    label: 'ציון מומלץ',
                    data: products.map(p => p.score),
                    backgroundColor: products.map(p => {
                        if (p.score >= 80) return '#10b981';
                        if (p.score >= 60) return '#3b82f6';
                        if (p.score >= 40) return '#f59e0b';
                        return '#ef4444';
                    })
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { labels: { color: textColor } } },
                scales: {
                    y: { beginAtZero: true, max: 100, ticks: { color: textColor }, grid: { color: gridColor } },
                    x: { ticks: { color: textColor }, grid: { color: gridColor } }
                }
            }
        });
    }
    
    // Orders Chart
    const ordersCtx = document.getElementById('ordersChart');
    if (ordersCtx && products.length > 0) {
        new Chart(ordersCtx, {
            type: 'bar',
            data: {
                labels: products.map(p => p.name.substring(0, 15) + '...'),
                datasets: [{
                    label: 'מספר הזמנות',
                    data: products.map(p => p.orders),
                    backgroundColor: '#f093fb'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                indexAxis: 'y',
                plugins: { legend: { labels: { color: textColor } } },
                scales: {
                    x: { ticks: { color: textColor }, grid: { color: gridColor } },
                    y: { ticks: { color: textColor }, grid: { color: gridColor } }
                }
            }
        });
    }
}

function renderSmartInsights() {
    const insights = store.getSmartRecommendations();
    const container = document.getElementById('smartInsights');
    
    if (!container) return;
    
    if (insights.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:40px;">אין תובנות כרגע - הוסף מוצרים להשוואה!</p>';
        return;
    }
    
    container.innerHTML = insights.map(insight => `
        <div class="insight-item ${insight.type}">
            <div class="insight-icon">${insight.icon}</div>
            <div class="insight-content">
                <h4>${insight.title}</h4>
                <p>${insight.message}</p>
            </div>
        </div>
    `).join('');
}

// ===== Settings Page =====
function renderSettingsPage() {
    const settings = store.getSettings();
    
    const elements = {
        'defaultCurrency': settings.defaultCurrency || 'USD',
        'exchangeRate': settings.exchangeRate || 3.7,
        'customsThreshold': settings.customsThreshold || 75,
        'vatRate': settings.vatRate || 17,
        'customsRate': settings.customsRate || 12,
        'fontSize': settings.fontSize || 16,
        'density': settings.density || 'comfortable'
    };
    
    Object.keys(elements).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = elements[id];
    });
    
    const checkboxes = {
        'enableCustoms': settings.enableCustoms !== false,
        'enableNotifications': settings.enableNotifications || false,
        'priceDropAlerts': settings.priceDropAlerts !== false,
        'reminderAlerts': settings.reminderAlerts !== false,
        'showImages': settings.showImages !== false
    };
    
    Object.keys(checkboxes).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.checked = checkboxes[id];
    });
    
    // Apply current theme
    const theme = document.body.dataset.theme || 'light';
    document.querySelectorAll('.theme-option').forEach(opt => {
        opt.classList.remove('active');
        if (opt.dataset.theme === theme) {
            opt.classList.add('active');
        }
    });
}

function saveAllSettings() {
    const getValue = (id, type = 'value') => {
        const el = document.getElementById(id);
        if (!el) return null;
        return type === 'checked' ? el.checked : el.value;
    };
    
    const settings = {
        defaultCurrency: getValue('defaultCurrency'),
        exchangeRate: parseFloat(getValue('exchangeRate')),
        enableCustoms: getValue('enableCustoms', 'checked'),
        customsThreshold: parseFloat(getValue('customsThreshold')),
        vatRate: parseFloat(getValue('vatRate')),
        customsRate: parseFloat(getValue('customsRate')),
        enableNotifications: getValue('enableNotifications', 'checked'),
        priceDropAlerts: getValue('priceDropAlerts', 'checked'),
        reminderAlerts: getValue('reminderAlerts', 'checked'),
        fontSize: parseInt(getValue('fontSize')),
        density: getValue('density'),
        showImages: getValue('showImages', 'checked'),
        theme: document.body.dataset.theme || 'light'
    };
    
    store.saveSettings(settings);
    applySettings(settings);
    showToast('ההגדרות נשמרו בהצלחה!', 'success');
}

function applySettings(settings) {
    document.documentElement.style.fontSize = `${settings.fontSize}px`;
    document.body.className = document.body.className.split(' ').filter(c => !['compact', 'comfortable', 'spacious'].includes(c)).join(' ');
    if (settings.density) {
        document.body.classList.add(settings.density);
    }
    
    if (settings.enableNotifications && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// Theme selector
document.addEventListener('click', function(e) {
    if (e.target.closest('.theme-option')) {
        const themeBtn = e.target.closest('.theme-option');
        const theme = themeBtn.dataset.theme;
        
        document.querySelectorAll('.theme-option').forEach(opt => opt.classList.remove('active'));
        themeBtn.classList.add('active');
        
        document.body.className = document.body.className.split(' ').filter(c => c !== 'dark-theme').join(' ');
        if (theme !== 'light') {
            document.body.classList.add('dark-theme');
        }
        document.body.dataset.theme = theme;
        
        trackAchievement('dark_mode');
        
        setTimeout(saveAllSettings, 100);
    }
});

// Auto-save on settings change
['defaultCurrency', 'exchangeRate', 'enableCustoms', 'customsThreshold', 'vatRate', 'customsRate',
 'enableNotifications', 'priceDropAlerts', 'reminderAlerts', 'fontSize', 'density', 'showImages'].forEach(id => {
    const element = document.getElementById(id);
    if (element) {
        element.addEventListener('change', saveAllSettings);
    }
});

// ===== Data Management Functions =====
function exportAllData() {
    const data = store.exportAll();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `aliexpress-tracker-backup-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showToast('הנתונים יוצאו בהצלחה!', 'success');
    trackAchievement('excel_export');
}

function importData() {
    const input = document.getElementById('importFile');
    if (input) input.click();
}

// Handle file import
if (document.getElementById('importFile')) {
    document.getElementById('importFile').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const data = JSON.parse(event.target.result);
                
                if (confirm('האם אתה בטוח? פעולה זו תחליף את כל הנתונים הקיימים!')) {
                    store.importAll(data);
                    showToast('הנתונים יובאו בהצלחה!', 'success');
                    setTimeout(() => location.reload(), 1500);
                }
            } catch (error) {
                console.error('Import error:', error);
                showToast('שגיאה בקריאת הקובץ', 'error');
            }
        };
        reader.readAsText(file);
        e.target.value = ''; // Reset input
    });
}

function downloadQRBackup() {
    const data = store.exportAll();
    const json = JSON.stringify(data);
    const compressed = json.substring(0, 2000); // QR limit
    
    const modal = document.getElementById('qrDisplayModal');
    const container = document.getElementById('productQRCode');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (typeof QRCode !== 'undefined') {
        new QRCode(container, {
            text: compressed,
            width: 512,
            height: 512,
            correctLevel: QRCode.CorrectLevel.L
        });
        modal.classList.add('active');
        showToast('סרוק ב-QR במכשיר אחר לייבוא!', 'success');
    }
}

function clearAllData() {
    if (confirm('האם אתה בטוח? כל הנתונים יימחקו לצמיתות!')) {
        if (confirm('אישור אחרון - זו פעולה בלתי הפיכה!')) {
            localStorage.clear();
            showToast('כל הנתונים נמחקו', 'success');
            setTimeout(() => location.reload(), 1000);
        }
    }
}

function exportAllReports() {
    const products = store.getProducts();
    
    if (products.length === 0) {
        showToast('אין נתונים לייצוא', 'warning');
        return;
    }
    
    // Create detailed CSV
    const headers = ['שם', 'מחיר', 'משלוח', 'מחיר כולל', 'דירוג', 'הזמנות', 'משלוח (ימים)', 'ציון', 'קטגוריה', 'קישור'];
    let csv = headers.join(',') + '\n';
    
    products.forEach(p => {
        const category = store.detectCategory(p.name);
        csv += `"${p.name}",${p.price},${p.shippingCost || 0},${p.realPrice},${p.rating},${p.orders},${p.deliveryDays || '-'},${p.score},"${category}","${p.link}"\n`;
    });
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `aliexpress-report-${Date.now()}.csv`;
    link.click();
    
    showToast('הדוח יוצא בהצלחה!', 'success');
    trackAchievement('excel_export');
}

// ===== Enhanced Navigation =====
const originalNavigate = window.navigateToPage;
if (originalNavigate) {
    window.navigateToPage = function(pageName) {
        originalNavigate(pageName);
        
        setTimeout(() => {
            switch(pageName) {
                case 'reports':
                    renderReportsPage();
                    break;
                case 'achievements':
                    if (typeof achievementsSystem !== 'undefined') {
                        achievementsSystem.renderAchievementsPage();
                    }
                    break;
                case 'settings':
                    renderSettingsPage();
                    break;
            }
        }, 100);
    };
}

// ===== Initialize on Load =====
document.addEventListener('DOMContentLoaded', function() {
    // Apply saved settings
    const settings = store.getSettings();
    applySettings(settings);
    
    // Set initial theme
    if (settings.theme && settings.theme !== 'light') {
        document.body.classList.add('dark-theme');
        document.body.dataset.theme = settings.theme;
    }
});

console.log('✅ Enhanced features loaded successfully!');
