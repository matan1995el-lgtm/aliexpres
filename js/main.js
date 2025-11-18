// ===== Data Storage =====
class DataStore {
    constructor() {
        this.profiles = this.loadData('profiles') || [];
        this.products = this.loadData('products') || [];
        this.favorites = this.loadData('favorites') || [];
        this.activities = this.loadData('activities') || [];
    }

    loadData(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error(`Error loading ${key}:`, e);
            return null;
        }
    }

    saveData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error(`Error saving ${key}:`, e);
        }
    }

    // Profiles
    addProfile(profile) {
        profile.id = Date.now().toString();
        profile.createdAt = new Date().toISOString();
        this.profiles.push(profile);
        this.saveData('profiles', this.profiles);
        this.addActivity('profile', `נוצר פרופיל חדש: ${profile.name}`);
        return profile;
    }

    updateProfile(id, updates) {
        const index = this.profiles.findIndex(p => p.id === id);
        if (index !== -1) {
            this.profiles[index] = { ...this.profiles[index], ...updates };
            this.saveData('profiles', this.profiles);
            return this.profiles[index];
        }
        return null;
    }

    deleteProfile(id) {
        this.profiles = this.profiles.filter(p => p.id !== id);
        this.saveData('profiles', this.profiles);
    }

    getProfiles() {
        return this.profiles;
    }

    // Products
    addProduct(product) {
        product.id = Date.now().toString();
        product.createdAt = new Date().toISOString();
        product.realPrice = parseFloat(product.price) + parseFloat(product.shippingCost || 0);
        product.score = this.calculateScore(product);
        this.products.push(product);
        this.saveData('products', this.products);
        this.addActivity('product', `נוסף מוצר חדש: ${product.name}`);
        return product;
    }

    updateProduct(id, updates) {
        const index = this.products.findIndex(p => p.id === id);
        if (index !== -1) {
            this.products[index] = { ...this.products[index], ...updates };
            this.products[index].realPrice = parseFloat(this.products[index].price) + parseFloat(this.products[index].shippingCost || 0);
            this.products[index].score = this.calculateScore(this.products[index]);
            this.saveData('products', this.products);
            return this.products[index];
        }
        return null;
    }

    deleteProduct(id) {
        this.products = this.products.filter(p => p.id !== id);
        this.saveData('products', this.products);
    }

    getProducts() {
        return this.products;
    }

    // Favorites
    addFavorite(favorite) {
        favorite.id = Date.now().toString();
        favorite.createdAt = new Date().toISOString();
        favorite.priceHistory = [{ date: new Date().toISOString(), price: favorite.currentPrice }];
        this.favorites.push(favorite);
        this.saveData('favorites', this.favorites);
        this.addActivity('favorite', `נוסף למועדפים: ${favorite.name}`);
        return favorite;
    }

    updateFavorite(id, updates) {
        const index = this.favorites.findIndex(f => f.id === id);
        if (index !== -1) {
            const oldPrice = this.favorites[index].currentPrice;
            this.favorites[index] = { ...this.favorites[index], ...updates };
            
            // Update price history if price changed
            if (updates.currentPrice && updates.currentPrice !== oldPrice) {
                this.favorites[index].priceHistory.push({
                    date: new Date().toISOString(),
                    price: updates.currentPrice
                });
            }
            
            this.saveData('favorites', this.favorites);
            return this.favorites[index];
        }
        return null;
    }

    deleteFavorite(id) {
        this.favorites = this.favorites.filter(f => f.id !== id);
        this.saveData('favorites', this.favorites);
    }

    getFavorites() {
        return this.favorites;
    }

    // Activities
    addActivity(type, message) {
        const activity = {
            id: Date.now().toString(),
            type,
            message,
            timestamp: new Date().toISOString()
        };
        this.activities.unshift(activity);
        this.activities = this.activities.slice(0, 10); // Keep only last 10
        this.saveData('activities', this.activities);
    }

    getActivities() {
        return this.activities;
    }

    // Calculate recommendation score (0-100)
    calculateScore(product) {
        const priceWeight = 0.3;
        const ratingWeight = 0.4;
        const ordersWeight = 0.3;

        // Normalize values (assuming max price $200, max orders 10000)
        const priceScore = Math.max(0, 100 - (product.realPrice / 2));
        const ratingScore = (parseFloat(product.rating) / 5) * 100;
        const ordersScore = Math.min(100, (parseInt(product.orders) / 100));

        return Math.round(
            priceScore * priceWeight +
            ratingScore * ratingWeight +
            ordersScore * ordersWeight
        );
    }

    // Calculate customs (Israeli taxes)
    calculateCustoms(price, shipping) {
        const settings = this.getSettings();
        const exchangeRate = parseFloat(settings.exchangeRate || 3.7);
        const threshold = parseFloat(settings.customsThreshold || 75);
        const vatRate = parseFloat(settings.vatRate || 17) / 100;
        const customsRate = parseFloat(settings.customsRate || 12) / 100;
        
        const totalUSD = price + shipping;
        
        if (totalUSD < threshold) {
            // Below threshold - no customs
            return {
                subtotal: totalUSD,
                vat: 0,
                customs: 0,
                total: totalUSD,
                totalILS: totalUSD * exchangeRate,
                hasTax: false
            };
        }
        
        // Above threshold - add taxes
        const vat = totalUSD * vatRate;
        const customs = totalUSD * customsRate;
        const total = totalUSD + vat + customs;
        
        return {
            subtotal: totalUSD,
            vat: vat,
            customs: customs,
            total: total,
            totalILS: total * exchangeRate,
            hasTax: true
        };
    }

    // Settings management
    getSettings() {
        return this.loadData('settings') || {
            defaultCurrency: 'USD',
            exchangeRate: 3.7,
            enableCustoms: true,
            customsThreshold: 75,
            vatRate: 17,
            customsRate: 12,
            enableNotifications: false,
            priceDropAlerts: true,
            reminderAlerts: true,
            fontSize: 16,
            density: 'comfortable',
            showImages: true,
            theme: 'light'
        };
    }

    saveSettings(settings) {
        this.saveData('settings', settings);
    }

    // Get all data for export
    exportAll() {
        return {
            profiles: this.profiles,
            products: this.products,
            favorites: this.favorites,
            activities: this.activities,
            settings: this.getSettings(),
            achievements: achievementsSystem.achievements,
            exportDate: new Date().toISOString(),
            version: '2.0.0'
        };
    }

    // Import all data
    importAll(data) {
        if (data.profiles) {
            this.profiles = data.profiles;
            this.saveData('profiles', this.profiles);
        }
        if (data.products) {
            this.products = data.products;
            this.saveData('products', this.products);
        }
        if (data.favorites) {
            this.favorites = data.favorites;
            this.saveData('favorites', this.favorites);
        }
        if (data.activities) {
            this.activities = data.activities;
            this.saveData('activities', this.activities);
        }
        if (data.settings) {
            this.saveSettings(data.settings);
        }
        if (data.achievements) {
            localStorage.setItem('achievements', JSON.stringify(data.achievements));
            achievementsSystem.loadAchievements();
        }
    }

    // Calculate total savings
    getTotalSavings() {
        return this.favorites.reduce((total, fav) => {
            if (fav.targetPrice && fav.currentPrice) {
                const diff = parseFloat(fav.currentPrice) - parseFloat(fav.targetPrice);
                if (diff < 0) {
                    total += Math.abs(diff);
                }
            }
            return total;
        }, 0);
    }

    // Get category statistics
    getCategoryStats() {
        const categories = {};
        
        [...this.products, ...this.favorites].forEach(item => {
            const category = this.detectCategory(item.name);
            categories[category] = (categories[category] || 0) + 1;
        });
        
        return categories;
    }

    // Smart category detection
    detectCategory(productName) {
        const name = productName.toLowerCase();
        
        if (name.includes('earbuds') || name.includes('headphone') || name.includes('אוזני')) return 'אוזניות';
        if (name.includes('watch') || name.includes('שעון')) return 'שעונים';
        if (name.includes('phone') || name.includes('טלפון')) return 'טלפונים';
        if (name.includes('cable') || name.includes('charger') || name.includes('כבל') || name.includes('מטען')) return 'אביזרים';
        if (name.includes('speaker') || name.includes('רמקול')) return 'רמקולים';
        if (name.includes('case') || name.includes('cover') || name.includes('כיסוי')) return 'כיסויים';
        if (name.includes('light') || name.includes('lamp') || name.includes('led')) return 'תאורה';
        if (name.includes('shirt') || name.includes('pants') || name.includes('dress')) return 'בגדים';
        if (name.includes('shoe') || name.includes('נעל')) return 'נעליים';
        if (name.includes('toy') || name.includes('צעצוע')) return 'צעצועים';
        if (name.includes('kitchen') || name.includes('מטבח')) return 'מטבח';
        if (name.includes('beauty') || name.includes('makeup') || name.includes('קוסמטיקה')) return 'יופי';
        
        return 'אחר';
    }

    // Get smart recommendations
    getSmartRecommendations() {
        const recommendations = [];
        const products = this.products;
        
        if (products.length === 0) return recommendations;
        
        // Calculate average price
        const avgPrice = products.reduce((sum, p) => sum + p.realPrice, 0) / products.length;
        
        products.forEach(product => {
            // Price comparison
            if (product.realPrice > avgPrice * 1.2) {
                recommendations.push({
                    type: 'warning',
                    icon: '⚠️',
                    title: 'מחיר גבוה',
                    message: `${product.name} יקר ב-${Math.round((product.realPrice / avgPrice - 1) * 100)}% מהממוצע`
                });
            }
            
            if (product.realPrice < avgPrice * 0.8) {
                recommendations.push({
                    type: 'positive',
                    icon: '💰',
                    title: 'עסקה טובה',
                    message: `${product.name} זול ב-${Math.round((1 - product.realPrice / avgPrice) * 100)}% מהממוצע!`
                });
            }
            
            // Rating vs Orders
            if (product.rating >= 4.7 && product.orders >= 5000) {
                recommendations.push({
                    type: 'positive',
                    icon: '🌟',
                    title: 'מומלץ מאוד',
                    message: `${product.name} - דירוג גבוה עם הרבה הזמנות`
                });
            }
            
            if (product.rating < 4 && product.orders < 100) {
                recommendations.push({
                    type: 'warning',
                    icon: '🚨',
                    title: 'זהירות',
                    message: `${product.name} - דירוג נמוך ומעט הזמנות`
                });
            }
            
            // Score based
            if (product.score >= 90) {
                recommendations.push({
                    type: 'positive',
                    icon: '🏆',
                    title: 'בחירה מעולה',
                    message: `${product.name} קיבל ציון ${product.score}/100`
                });
            }
            
            // Delivery time
            if (product.deliveryDays && product.deliveryDays <= 10) {
                recommendations.push({
                    type: 'info',
                    icon: '⚡',
                    title: 'משלוח מהיר',
                    message: `${product.name} - ${product.deliveryDays} ימים בלבד!`
                });
            }
        });
        
        return recommendations.slice(0, 10); // Top 10 recommendations
    }
}

// ===== Initialize =====
const store = new DataStore();
let currentPage = 'dashboard';
let priceChart = null;
let scoreChart = null;

// ===== Theme Management =====
function initTheme() {
    const settings = store.getSettings();
    let theme = localStorage.getItem('theme');
    
    // אם אין הגדרה שמורה, נסה לזהות אוטומטית
    if (!theme) {
        // 1. זיהוי העדפת מערכת (OS)
        if (window.matchMedia && settings.autoDetectTheme !== false) {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            theme = prefersDark ? 'dark' : 'light';
        }
        
        // 2. זיהוי לפי שעה (אם מופעל)
        if (settings.autoThemeByTime) {
            const hour = new Date().getHours();
            // לילה: 20:00 - 06:00
            if (hour >= 20 || hour < 6) {
                theme = 'dark';
            } else {
                theme = 'light';
            }
        }
    }
    
    // החל ערכת נושא
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
        const icon = document.querySelector('#themeToggle i');
        if (icon) icon.classList.replace('fa-moon', 'fa-sun');
    }
    
    // האזן לשינויים במערכת (OS)
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (settings.autoDetectTheme !== false && !localStorage.getItem('theme')) {
                if (e.matches) {
                    document.body.classList.add('dark-theme');
                    document.querySelector('#themeToggle i')?.classList.replace('fa-moon', 'fa-sun');
                } else {
                    document.body.classList.remove('dark-theme');
                    document.querySelector('#themeToggle i')?.classList.replace('fa-sun', 'fa-moon');
                }
            }
        });
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    const icon = document.querySelector('#themeToggle i');
    
    if (isDark) {
        icon.classList.replace('fa-moon', 'fa-sun');
        localStorage.setItem('theme', 'dark');
    } else {
        icon.classList.replace('fa-sun', 'fa-moon');
        localStorage.setItem('theme', 'light');
    }
    
    // Update charts if visible
    if (priceChart || scoreChart) {
        renderCharts();
    }
}

// ===== Navigation =====
function navigateToPage(pageName) {
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === pageName) {
            item.classList.add('active');
        }
    });

    // Update pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(`${pageName}-page`).classList.add('active');

    currentPage = pageName;

    // Render page content
    switch(pageName) {
        case 'dashboard':
            renderDashboard();
            break;
        case 'criteria':
            renderProfiles();
            break;
        case 'compare':
            renderProducts();
            break;
        case 'favorites':
            renderFavorites();
            break;
    }
}

// ===== Dashboard =====
function renderDashboard() {
    // Update statistics
    document.getElementById('profilesCount').textContent = store.getProfiles().length;
    document.getElementById('productsCount').textContent = store.getProducts().length;
    document.getElementById('favoritesCount').textContent = store.getFavorites().length;
    
    // Best deal
    const products = store.getProducts();
    if (products.length > 0) {
        const bestProduct = products.reduce((best, product) => 
            product.score > best.score ? product : best
        );
        document.getElementById('bestDealCount').textContent = `${bestProduct.score}/100`;
    }

    // Render activities
    const activities = store.getActivities();
    const activityContainer = document.getElementById('recentActivity');
    
    if (activities.length === 0) {
        activityContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>אין פעילות עדיין. התחל להשתמש במערכת!</p>
            </div>
        `;
    } else {
        activityContainer.innerHTML = activities.map(activity => {
            const date = new Date(activity.timestamp);
            const timeAgo = getTimeAgo(date);
            const iconColor = getActivityIconColor(activity.type);
            
            return `
                <div class="activity-item">
                    <div class="activity-icon" style="background: ${iconColor};">
                        <i class="fas fa-${getActivityIcon(activity.type)}"></i>
                    </div>
                    <div class="activity-content">
                        <p>${activity.message}</p>
                        <span class="activity-time">${timeAgo}</span>
                    </div>
                </div>
            `;
        }).join('');
    }
}

function getActivityIcon(type) {
    const icons = {
        profile: 'filter',
        product: 'box',
        favorite: 'star'
    };
    return icons[type] || 'info-circle';
}

function getActivityIconColor(type) {
    const colors = {
        profile: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        product: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        favorite: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)'
    };
    return colors[type] || 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)';
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'עכשיו';
    if (seconds < 3600) return `לפני ${Math.floor(seconds / 60)} דקות`;
    if (seconds < 86400) return `לפני ${Math.floor(seconds / 3600)} שעות`;
    return `לפני ${Math.floor(seconds / 86400)} ימים`;
}

// ===== Profiles (Criteria) =====
function renderProfiles() {
    const profiles = store.getProfiles();
    const container = document.getElementById('profilesList');

    if (profiles.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-filter"></i>
                <p>עדיין לא יצרת פרופילי חיפוש</p>
                <button class="btn btn-primary" onclick="openProfileModal()">
                    <i class="fas fa-plus"></i>
                    צור פרופיל ראשון
                </button>
            </div>
        `;
    } else {
        container.innerHTML = profiles.map(profile => `
            <div class="profile-card">
                <div class="profile-header">
                    <h3>${profile.name}</h3>
                    <div class="profile-actions">
                        <button class="icon-btn" onclick="editProfile('${profile.id}')" title="ערוך">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="icon-btn danger" onclick="deleteProfileConfirm('${profile.id}')" title="מחק">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="profile-criteria">
                    ${profile.minPrice || profile.maxPrice ? `
                        <div class="criteria-item">
                            <i class="fas fa-dollar-sign"></i>
                            <span>מחיר: <strong>${profile.minPrice || '0'}$ - ${profile.maxPrice || '∞'}$</strong></span>
                        </div>
                    ` : ''}
                    ${profile.minOrders ? `
                        <div class="criteria-item">
                            <i class="fas fa-shopping-cart"></i>
                            <span>הזמנות מינימום: <strong>${profile.minOrders}+</strong></span>
                        </div>
                    ` : ''}
                    ${profile.minRating ? `
                        <div class="criteria-item">
                            <i class="fas fa-star"></i>
                            <span>דירוג מינימום: <strong>${profile.minRating}+ כוכבים</strong></span>
                        </div>
                    ` : ''}
                    ${profile.freeShipping && profile.freeShipping !== '' ? `
                        <div class="criteria-item">
                            <i class="fas fa-shipping-fast"></i>
                            <span>משלוח חינם: <strong>${profile.freeShipping === 'yes' ? 'כן' : 'לא'}</strong></span>
                        </div>
                    ` : ''}
                    ${profile.maxDeliveryDays ? `
                        <div class="criteria-item">
                            <i class="fas fa-clock"></i>
                            <span>זמן משלוח מקסימלי: <strong>${profile.maxDeliveryDays} ימים</strong></span>
                        </div>
                    ` : ''}
                    ${profile.shippingFrom && profile.shippingFrom !== '' ? `
                        <div class="criteria-item">
                            <i class="fas fa-globe"></i>
                            <span>שילוח מ-: <strong>${getCountryName(profile.shippingFrom)}</strong></span>
                        </div>
                    ` : ''}
                    ${profile.category ? `
                        <div class="criteria-item">
                            <i class="fas fa-tag"></i>
                            <span>סוג: <strong>${profile.category}</strong></span>
                        </div>
                    ` : ''}
                    ${profile.topSeller ? `
                        <div class="criteria-item">
                            <i class="fas fa-trophy"></i>
                            <span><strong>מוכרים מובילים בלבד</strong></span>
                        </div>
                    ` : ''}
                    ${profile.choiceProduct ? `
                        <div class="criteria-item">
                            <i class="fas fa-bolt"></i>
                            <span><strong>מוצרי Choice בלבד</strong></span>
                        </div>
                    ` : ''}
                    ${profile.notes ? `
                        <div class="criteria-item">
                            <i class="fas fa-comment"></i>
                            <span>${profile.notes}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }
}

function getCountryName(code) {
    const countries = {
        china: 'סין',
        russia: 'רוסיה',
        usa: 'ארה"ב',
        europe: 'אירופה',
        israel: 'ישראל'
    };
    return countries[code] || code;
}

function openProfileModal(profileId = null) {
    const modal = document.getElementById('profileModal');
    const form = document.getElementById('profileForm');
    
    form.reset();
    
    if (profileId) {
        const profile = store.getProfiles().find(p => p.id === profileId);
        if (profile) {
            form.name.value = profile.name || '';
            form.minPrice.value = profile.minPrice || '';
            form.maxPrice.value = profile.maxPrice || '';
            form.minOrders.value = profile.minOrders || '';
            form.minRating.value = profile.minRating || '';
            form.freeShipping.value = profile.freeShipping || '';
            form.maxDeliveryDays.value = profile.maxDeliveryDays || '';
            form.shippingFrom.value = profile.shippingFrom || '';
            form.category.value = profile.category || '';
            form.topSeller.checked = profile.topSeller || false;
            form.choiceProduct.checked = profile.choiceProduct || false;
            form.notes.value = profile.notes || '';
            form.dataset.editId = profileId;
        }
    } else {
        delete form.dataset.editId;
    }
    
    modal.classList.add('active');
}

function closeProfileModal() {
    document.getElementById('profileModal').classList.remove('active');
}

function editProfile(id) {
    openProfileModal(id);
}

function deleteProfileConfirm(id) {
    if (confirm('האם אתה בטוח שברצונך למחוק פרופיל זה?')) {
        store.deleteProfile(id);
        renderProfiles();
        showToast('הפרופיל נמחק בהצלחה', 'success');
    }
}

// ===== Products (Compare) =====
function renderProducts() {
    const products = store.getProducts();
    const container = document.getElementById('productsTable');
    const chartsSection = document.getElementById('chartsSection');

    if (products.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <p>עדיין לא הוספת מוצרים להשוואה</p>
                <button class="btn btn-primary" onclick="openProductModal()">
                    <i class="fas fa-plus"></i>
                    הוסף מוצר ראשון
                </button>
            </div>
        `;
        chartsSection.style.display = 'none';
    } else {
        // Find lowest price
        const lowestPrice = Math.min(...products.map(p => p.realPrice));
        
        container.innerHTML = `
            <table class="products-table">
                <thead>
                    <tr>
                        <th>שם המוצר</th>
                        <th>מחיר ($)</th>
                        <th>משלוח ($)</th>
                        <th>מחיר כולל ($)</th>
                        <th>דירוג</th>
                        <th>הזמנות</th>
                        <th>זמן משלוח</th>
                        <th>ציון מומלץ</th>
                        <th>פעולות</th>
                    </tr>
                </thead>
                <tbody>
                    ${products.map(product => `
                        <tr>
                            <td>
                                <div class="product-name">${product.name}</div>
                                <a href="${product.link}" target="_blank" class="product-link">
                                    <i class="fas fa-external-link-alt"></i> קישור למוצר
                                </a>
                            </td>
                            <td class="price-cell">$${parseFloat(product.price).toFixed(2)}</td>
                            <td>$${parseFloat(product.shippingCost || 0).toFixed(2)}</td>
                            <td class="price-cell ${product.realPrice === lowestPrice ? 'lowest-price' : ''}">
                                $${product.realPrice.toFixed(2)}
                                ${product.realPrice === lowestPrice ? ' 🏆' : ''}
                            </td>
                            <td>
                                <span class="rating-badge">
                                    <i class="fas fa-star"></i>
                                    ${parseFloat(product.rating).toFixed(1)}
                                </span>
                            </td>
                            <td>
                                <span class="orders-badge">
                                    ${parseInt(product.orders).toLocaleString()}
                                </span>
                            </td>
                            <td>${product.deliveryDays ? `${product.deliveryDays} ימים` : '-'}</td>
                            <td>
                                <span class="score-badge ${getScoreClass(product.score)}">
                                    ${product.score}/100
                                </span>
                            </td>
                            <td>
                                <div class="table-actions">
                                    <button class="icon-btn" onclick="editProduct('${product.id}')" title="ערוך">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="icon-btn danger" onclick="deleteProductConfirm('${product.id}')" title="מחק">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        chartsSection.style.display = 'block';
        renderCharts();
    }
    
    applyProductFilters();
}

function getScoreClass(score) {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    if (score >= 40) return 'score-average';
    return 'score-poor';
}

function renderCharts() {
    const products = store.getProducts();
    if (products.length === 0) return;

    const isDark = document.body.classList.contains('dark-theme');
    const textColor = isDark ? '#f1f5f9' : '#1e293b';
    const gridColor = isDark ? '#334155' : '#e2e8f0';

    // Price Chart
    const priceCtx = document.getElementById('priceChart');
    if (priceCtx) {
        if (priceChart) priceChart.destroy();
        
        priceChart = new Chart(priceCtx, {
            type: 'bar',
            data: {
                labels: products.map(p => p.name.substring(0, 20) + '...'),
                datasets: [{
                    label: 'מחיר כולל ($)',
                    data: products.map(p => p.realPrice),
                    backgroundColor: products.map(p => {
                        const minPrice = Math.min(...products.map(pr => pr.realPrice));
                        return p.realPrice === minPrice ? 
                            'rgba(16, 185, 129, 0.7)' : 
                            'rgba(102, 126, 234, 0.7)';
                    }),
                    borderColor: products.map(p => {
                        const minPrice = Math.min(...products.map(pr => pr.realPrice));
                        return p.realPrice === minPrice ? 
                            'rgb(16, 185, 129)' : 
                            'rgb(102, 126, 234)';
                    }),
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        labels: { color: textColor }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: textColor },
                        grid: { color: gridColor }
                    },
                    x: {
                        ticks: { color: textColor },
                        grid: { color: gridColor }
                    }
                }
            }
        });
    }

    // Score Chart
    const scoreCtx = document.getElementById('scoreChart');
    if (scoreCtx) {
        if (scoreChart) scoreChart.destroy();
        
        scoreChart = new Chart(scoreCtx, {
            type: 'radar',
            data: {
                labels: products.map(p => p.name.substring(0, 15) + '...'),
                datasets: [{
                    label: 'ציון מומלץ',
                    data: products.map(p => p.score),
                    backgroundColor: 'rgba(240, 147, 251, 0.2)',
                    borderColor: 'rgb(240, 147, 251)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgb(240, 147, 251)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(240, 147, 251)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        labels: { color: textColor }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { 
                            color: textColor,
                            backdropColor: 'transparent'
                        },
                        grid: { color: gridColor },
                        pointLabels: { color: textColor }
                    }
                }
            }
        });
    }
}

function applyProductFilters() {
    const searchInput = document.getElementById('searchProducts');
    const sortSelect = document.getElementById('sortProducts');
    
    if (searchInput && sortSelect) {
        searchInput.addEventListener('input', filterAndSortProducts);
        sortSelect.addEventListener('change', filterAndSortProducts);
    }
}

function filterAndSortProducts() {
    let products = [...store.getProducts()];
    const searchTerm = document.getElementById('searchProducts').value.toLowerCase();
    const sortBy = document.getElementById('sortProducts').value;

    // Filter
    if (searchTerm) {
        products = products.filter(p => 
            p.name.toLowerCase().includes(searchTerm) ||
            p.notes?.toLowerCase().includes(searchTerm)
        );
    }

    // Sort
    switch(sortBy) {
        case 'price-asc':
            products.sort((a, b) => a.realPrice - b.realPrice);
            break;
        case 'price-desc':
            products.sort((a, b) => b.realPrice - a.realPrice);
            break;
        case 'rating-desc':
            products.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
            break;
        case 'orders-desc':
            products.sort((a, b) => parseInt(b.orders) - parseInt(a.orders));
            break;
        case 'score-desc':
            products.sort((a, b) => b.score - a.score);
            break;
    }

    // Re-render table with filtered/sorted products
    renderFilteredProducts(products);
}

function renderFilteredProducts(products) {
    const container = document.getElementById('productsTable');
    
    if (products.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <p>לא נמצאו מוצרים התואמים לחיפוש</p>
            </div>
        `;
        return;
    }

    const lowestPrice = Math.min(...products.map(p => p.realPrice));
    
    container.innerHTML = `
        <table class="products-table">
            <thead>
                <tr>
                    <th>שם המוצר</th>
                    <th>מחיר ($)</th>
                    <th>משלוח ($)</th>
                    <th>מחיר כולל ($)</th>
                    <th>דירוג</th>
                    <th>הזמנות</th>
                    <th>זמן משלוח</th>
                    <th>ציון מומלץ</th>
                    <th>פעולות</th>
                </tr>
            </thead>
            <tbody>
                ${products.map(product => `
                    <tr>
                        <td>
                            <div class="product-name">${product.name}</div>
                            <a href="${product.link}" target="_blank" class="product-link">
                                <i class="fas fa-external-link-alt"></i> קישור למוצר
                            </a>
                        </td>
                        <td class="price-cell">$${parseFloat(product.price).toFixed(2)}</td>
                        <td>$${parseFloat(product.shippingCost || 0).toFixed(2)}</td>
                        <td class="price-cell ${product.realPrice === lowestPrice ? 'lowest-price' : ''}">
                            $${product.realPrice.toFixed(2)}
                            ${product.realPrice === lowestPrice ? ' 🏆' : ''}
                        </td>
                        <td>
                            <span class="rating-badge">
                                <i class="fas fa-star"></i>
                                ${parseFloat(product.rating).toFixed(1)}
                            </span>
                        </td>
                        <td>
                            <span class="orders-badge">
                                ${parseInt(product.orders).toLocaleString()}
                            </span>
                        </td>
                        <td>${product.deliveryDays ? `${product.deliveryDays} ימים` : '-'}</td>
                        <td>
                            <span class="score-badge ${getScoreClass(product.score)}">
                                ${product.score}/100
                            </span>
                        </td>
                        <td>
                            <div class="table-actions">
                                <button class="icon-btn" onclick="editProduct('${product.id}')" title="ערוך">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="icon-btn danger" onclick="deleteProductConfirm('${product.id}')" title="מחק">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function openProductModal(productId = null) {
    const modal = document.getElementById('productModal');
    const form = document.getElementById('productForm');
    
    form.reset();
    
    if (productId) {
        const product = store.getProducts().find(p => p.id === productId);
        if (product) {
            form.name.value = product.name || '';
            form.price.value = product.price || '';
            form.shippingCost.value = product.shippingCost || '';
            form.rating.value = product.rating || '';
            form.orders.value = product.orders || '';
            form.deliveryDays.value = product.deliveryDays || '';
            form.shippingFrom.value = product.shippingFrom || 'china';
            form.link.value = product.link || '';
            form.image.value = product.image || '';
            form.notes.value = product.notes || '';
            form.dataset.editId = productId;
        }
    } else {
        delete form.dataset.editId;
    }
    
    modal.classList.add('active');
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
}

function editProduct(id) {
    openProductModal(id);
}

function deleteProductConfirm(id) {
    if (confirm('האם אתה בטוח שברצונך למחוק מוצר זה?')) {
        store.deleteProduct(id);
        renderProducts();
        showToast('המוצר נמחק בהצלחה', 'success');
    }
}

// ===== Favorites =====
function renderFavorites() {
    const favorites = store.getFavorites();
    const container = document.getElementById('favoritesList');

    // Render tag filters
    renderTagFilters();

    if (favorites.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-heart"></i>
                <p>עדיין לא הוספת מוצרים למועדפים</p>
                <button class="btn btn-primary" onclick="openFavoriteModal()">
                    <i class="fas fa-plus"></i>
                    הוסף מועדף ראשון
                </button>
            </div>
        `;
    } else {
        container.innerHTML = favorites.map(favorite => {
            const priceDiff = favorite.targetPrice ? 
                parseFloat(favorite.currentPrice) - parseFloat(favorite.targetPrice) : null;
            
            return `
                <div class="favorite-card" data-tags="${favorite.tags || ''}">
                    <div class="favorite-header">
                        <h3>${favorite.name}</h3>
                        <span class="priority-badge priority-${favorite.priority}">
                            ${getPriorityText(favorite.priority)}
                        </span>
                    </div>
                    <div class="favorite-prices">
                        <div class="price-box">
                            <div class="price-label">מחיר נוכחי</div>
                            <div class="price-value">$${parseFloat(favorite.currentPrice).toFixed(2)}</div>
                            ${priceDiff !== null ? `
                                <div class="price-diff ${priceDiff > 0 ? 'negative' : 'positive'}">
                                    ${priceDiff > 0 ? '+' : ''}$${priceDiff.toFixed(2)} מהיעד
                                </div>
                            ` : ''}
                        </div>
                        ${favorite.targetPrice ? `
                            <div class="price-box">
                                <div class="price-label">מחיר יעד</div>
                                <div class="price-value">$${parseFloat(favorite.targetPrice).toFixed(2)}</div>
                            </div>
                        ` : ''}
                    </div>
                    ${favorite.tags ? `
                        <div class="favorite-tags">
                            ${favorite.tags.split(',').map(tag => `
                                <span class="tag">${tag.trim()}</span>
                            `).join('')}
                        </div>
                    ` : ''}
                    ${favorite.notes ? `
                        <div class="favorite-notes">${favorite.notes}</div>
                    ` : ''}
                    <div class="favorite-actions">
                        <a href="${favorite.link}" target="_blank" class="btn btn-primary btn-sm">
                            <i class="fas fa-external-link-alt"></i>
                            פתח מוצר
                        </a>
                        <button class="btn btn-secondary btn-sm" onclick="updateFavoritePrice('${favorite.id}')">
                            <i class="fas fa-sync"></i>
                            עדכן מחיר
                        </button>
                        <button class="icon-btn" onclick="editFavorite('${favorite.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="icon-btn danger" onclick="deleteFavoriteConfirm('${favorite.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
}

function getPriorityText(priority) {
    const priorities = {
        high: 'גבוהה',
        medium: 'בינונית',
        low: 'נמוכה'
    };
    return priorities[priority] || priority;
}

function renderTagFilters() {
    const favorites = store.getFavorites();
    const tagsSet = new Set();
    
    favorites.forEach(fav => {
        if (fav.tags) {
            fav.tags.split(',').forEach(tag => {
                tagsSet.add(tag.trim());
            });
        }
    });
    
    const tagsFilter = document.getElementById('tagsFilter');
    tagsFilter.innerHTML = `
        <button class="tag-btn active" data-tag="all" onclick="filterByTag('all')">הכל</button>
        ${Array.from(tagsSet).map(tag => `
            <button class="tag-btn" data-tag="${tag}" onclick="filterByTag('${tag}')">${tag}</button>
        `).join('')}
    `;
}

function filterByTag(tag) {
    // Update active tag button
    document.querySelectorAll('.tag-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tag === tag) {
            btn.classList.add('active');
        }
    });

    // Filter cards
    const cards = document.querySelectorAll('.favorite-card');
    cards.forEach(card => {
        if (tag === 'all') {
            card.style.display = 'block';
        } else {
            const cardTags = card.dataset.tags.split(',').map(t => t.trim());
            card.style.display = cardTags.includes(tag) ? 'block' : 'none';
        }
    });
}

function openFavoriteModal(favoriteId = null) {
    const modal = document.getElementById('favoriteModal');
    const form = document.getElementById('favoriteForm');
    
    form.reset();
    
    if (favoriteId) {
        const favorite = store.getFavorites().find(f => f.id === favoriteId);
        if (favorite) {
            form.name.value = favorite.name || '';
            form.currentPrice.value = favorite.currentPrice || '';
            form.targetPrice.value = favorite.targetPrice || '';
            form.link.value = favorite.link || '';
            form.tags.value = favorite.tags || '';
            form.priority.value = favorite.priority || 'medium';
            form.notes.value = favorite.notes || '';
            form.dataset.editId = favoriteId;
        }
    } else {
        delete form.dataset.editId;
    }
    
    modal.classList.add('active');
}

function closeFavoriteModal() {
    document.getElementById('favoriteModal').classList.remove('active');
}

function editFavorite(id) {
    openFavoriteModal(id);
}

function deleteFavoriteConfirm(id) {
    if (confirm('האם אתה בטוח שברצונך למחוק מועדף זה?')) {
        store.deleteFavorite(id);
        renderFavorites();
        showToast('המועדף נמחק בהצלחה', 'success');
    }
}

function updateFavoritePrice(id) {
    const newPrice = prompt('הזן מחיר חדש ($):');
    if (newPrice && !isNaN(newPrice)) {
        store.updateFavorite(id, { currentPrice: parseFloat(newPrice) });
        renderFavorites();
        showToast('המחיר עודכן בהצלחה', 'success');
    }
}

// ===== Export to Excel =====
function exportToExcel() {
    const products = store.getProducts();
    
    if (products.length === 0) {
        showToast('אין מוצרים לייצא', 'warning');
        return;
    }

    // Create CSV content
    let csv = 'שם המוצר,מחיר,עלות משלוח,מחיר כולל,דירוג,הזמנות,זמן משלוח,ציון מומלץ,קישור\n';
    
    products.forEach(product => {
        csv += `"${product.name}",`;
        csv += `${product.price},`;
        csv += `${product.shippingCost || 0},`;
        csv += `${product.realPrice},`;
        csv += `${product.rating},`;
        csv += `${product.orders},`;
        csv += `${product.deliveryDays || '-'},`;
        csv += `${product.score},`;
        csv += `"${product.link}"\n`;
    });

    // Create download link
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `aliexpress_products_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('הקובץ יוצא בהצלחה!', 'success');
}

// ===== Form Submissions =====
document.getElementById('profileForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const profile = {
        name: formData.get('name'),
        minPrice: formData.get('minPrice'),
        maxPrice: formData.get('maxPrice'),
        minOrders: formData.get('minOrders'),
        minRating: formData.get('minRating'),
        freeShipping: formData.get('freeShipping'),
        maxDeliveryDays: formData.get('maxDeliveryDays'),
        shippingFrom: formData.get('shippingFrom'),
        category: formData.get('category'),
        topSeller: formData.get('topSeller') === 'on',
        choiceProduct: formData.get('choiceProduct') === 'on',
        notes: formData.get('notes')
    };
    
    const editId = e.target.dataset.editId;
    
    if (editId) {
        store.updateProfile(editId, profile);
        showToast('הפרופיל עודכן בהצלחה!', 'success');
    } else {
        store.addProfile(profile);
        trackAchievement('profile_created');
        showToast('הפרופיל נוצר בהצלחה!', 'success');
    }
    
    closeProfileModal();
    renderProfiles();
    renderDashboard();
});

document.getElementById('productForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const product = {
        name: formData.get('name'),
        price: formData.get('price'),
        shippingCost: formData.get('shippingCost') || 0,
        rating: formData.get('rating'),
        orders: formData.get('orders'),
        deliveryDays: formData.get('deliveryDays'),
        shippingFrom: formData.get('shippingFrom'),
        link: formData.get('link'),
        image: formData.get('image'),
        notes: formData.get('notes'),
        // New fields
        size: formData.get('size'),
        weight: formData.get('weight'),
        battery: formData.get('battery'),
        colors: formData.get('colors'),
        warranty: formData.get('warranty'),
        material: formData.get('material'),
        positiveReviews: formData.get('positiveReviews'),
        photoReviews: formData.get('photoReviews'),
        reviewsPros: formData.get('reviewsPros'),
        reviewsCons: formData.get('reviewsCons'),
        buyerRecommendations: formData.get('buyerRecommendations')
    };
    
    // Handle image file upload
    const imageFile = formData.get('imageFile');
    if (imageFile && imageFile.size > 0) {
        const reader = new FileReader();
        reader.onload = function(event) {
            product.image = event.target.result;
            saveProduct(product, e.target.dataset.editId);
        };
        reader.readAsDataURL(imageFile);
    } else {
        saveProduct(product, e.target.dataset.editId);
    }
});

function saveProduct(product, editId) {
    if (editId) {
        store.updateProduct(editId, product);
        showToast('המוצר עודכן בהצלחה!', 'success');
    } else {
        const saved = store.addProduct(product);
        trackAchievement('product_added');
        
        // Check if it's a complete product (perfectionist achievement)
        if (product.size && product.battery && product.reviewsPros && product.reviewsCons) {
            trackAchievement('complete_product');
        }
        
        // Check high score
        if (saved.score >= 90) {
            trackAchievement('high_score_product');
        }
        
        showToast('המוצר נוסף בהצלחה!', 'success');
    }
    
    closeProductModal();
    renderProducts();
    renderDashboard();
}

document.getElementById('favoriteForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const favorite = {
        name: formData.get('name'),
        currentPrice: formData.get('currentPrice'),
        targetPrice: formData.get('targetPrice'),
        link: formData.get('link'),
        tags: formData.get('tags'),
        priority: formData.get('priority'),
        notes: formData.get('notes')
    };
    
    const editId = e.target.dataset.editId;
    
    if (editId) {
        store.updateFavorite(editId, favorite);
        showToast('המועדף עודכן בהצלחה!', 'success');
    } else {
        store.addFavorite(favorite);
        trackAchievement('favorite_added');
        showToast('המועדף נוסף בהצלחה!', 'success');
    }
    
    closeFavoriteModal();
    renderFavorites();
    renderDashboard();
});

// ===== Toast Notification =====
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ===== Event Listeners =====
document.getElementById('themeToggle').addEventListener('click', toggleTheme);

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        navigateToPage(item.dataset.page);
    });
});

// Close modals on outside click
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
    });
});

// ===== Helper Functions =====

// Render star rating
function renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);
    
    let html = '<span class="star-rating">';
    html += '<span class="star-full">' + '★'.repeat(fullStars) + '</span>';
    if (hasHalf) html += '<span class="star-half">⯨</span>';
    html += '<span class="star-empty">' + '☆'.repeat(emptyStars) + '</span>';
    html += '</span>';
    
    return html;
}

// Get product badges
function getProductBadges(product) {
    const badges = [];
    const avgPrice = store.getProducts().reduce((sum, p) => sum + p.realPrice, 0) / store.getProducts().length;
    
    // Hot deal
    if (product.realPrice < avgPrice * 0.8) {
        badges.push('<span class="badge badge-hot">🔥 מבצע חם</span>');
    }
    
    // Fast shipping
    if (product.deliveryDays && product.deliveryDays <= 10) {
        badges.push('<span class="badge badge-fast">⚡ משלוח מהיר</span>');
    }
    
    // Highly recommended
    if (product.score >= 90) {
        badges.push('<span class="badge badge-recommended">💎 מומלץ מאוד</span>');
    }
    
    // Best seller
    if (product.orders >= 5000) {
        badges.push('<span class="badge badge-bestseller">🏆 רב מכר</span>');
    }
    
    // Warning
    if (product.orders < 100 || product.rating < 4) {
        badges.push('<span class="badge badge-warning">⚠️ זהירות</span>');
    }
    
    // New
    const daysSinceAdded = (Date.now() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceAdded <= 3) {
        badges.push('<span class="badge badge-new">🆕 חדש</span>');
    }
    
    return badges.join('');
}

// ===== Reports Page =====
function renderReports() {
    const products = store.getProducts();
    const favorites = store.getFavorites();
    const settings = store.getSettings();
    
    // Calculate statistics
    const totalSavings = store.getTotalSavings();
    const exchangeRate = parseFloat(settings.exchangeRate || 3.7);
    
    document.getElementById('totalSavings').textContent = `₪${(totalSavings * exchangeRate).toFixed(0)}`;
    document.getElementById('purchasedCount').textContent = products.filter(p => p.purchased).length;
    document.getElementById('totalTracked').textContent = products.length + favorites.length;
    
    // Top category
    const categoryStats = store.getCategoryStats();
    const topCategory = Object.entries(categoryStats).sort((a, b) => b[1] - a[1])[0];
    document.getElementById('topCategory').textContent = topCategory ? topCategory[0] : '-';
    
    // Average rating
    const avgRating = products.length > 0 ?
        products.reduce((sum, p) => sum + parseFloat(p.rating), 0) / products.length : 0;
    document.getElementById('avgRating').textContent = avgRating.toFixed(1);
    
    // Render charts
    renderReportCharts();
    
    // Render insights
    renderSmartInsights();
}

function renderReportCharts() {
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
                        '#667eea', '#f093fb', '#4ecdc4', '#ffd700',
                        '#ff6b6b', '#95e1d3', '#f38181', '#aa96da'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        labels: { color: textColor }
                    }
                }
            }
        });
    }
    
    // Price Trend Chart (if favorites have price history)
    const favoritesWithHistory = store.getFavorites().filter(f => f.priceHistory && f.priceHistory.length > 1);
    
    if (favoritesWithHistory.length > 0) {
        const trendCtx = document.getElementById('priceTrendChart');
        const favorite = favoritesWithHistory[0]; // Show first one for example
        
        if (trendCtx) {
            new Chart(trendCtx, {
                type: 'line',
                data: {
                    labels: favorite.priceHistory.map(h => new Date(h.date).toLocaleDateString('he-IL')),
                    datasets: [{
                        label: favorite.name,
                        data: favorite.priceHistory.map(h => h.price),
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            labels: { color: textColor }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            ticks: { color: textColor },
                            grid: { color: gridColor }
                        },
                        x: {
                            ticks: { color: textColor },
                            grid: { color: gridColor }
                        }
                    }
                }
            });
        }
    }
}

function renderSmartInsights() {
    const recommendations = store.getSmartRecommendations();
    const container = document.getElementById('smartInsights');
    
    if (recommendations.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">אין תובנות זמינות כרגע</p>';
        return;
    }
    
    container.innerHTML = recommendations.map(rec => `
        <div class="insight-item ${rec.type}">
            <div class="insight-icon">${rec.icon}</div>
            <div class="insight-content">
                <h4>${rec.title}</h4>
                <p>${rec.message}</p>
            </div>
        </div>
    `).join('');
}

// ===== Settings Page =====
function renderSettings() {
    const settings = store.getSettings();
    
    // Apply current settings to form
    document.getElementById('defaultCurrency').value = settings.defaultCurrency || 'USD';
    document.getElementById('exchangeRate').value = settings.exchangeRate || 3.7;
    document.getElementById('enableCustoms').checked = settings.enableCustoms !== false;
    document.getElementById('customsThreshold').value = settings.customsThreshold || 75;
    document.getElementById('vatRate').value = settings.vatRate || 17;
    document.getElementById('customsRate').value = settings.customsRate || 12;
    document.getElementById('enableNotifications').checked = settings.enableNotifications || false;
    document.getElementById('priceDropAlerts').checked = settings.priceDropAlerts !== false;
    document.getElementById('reminderAlerts').checked = settings.reminderAlerts !== false;
    document.getElementById('fontSize').value = settings.fontSize || 16;
    document.getElementById('density').value = settings.density || 'comfortable';
    document.getElementById('showImages').checked = settings.showImages !== false;
    
    // Set active theme
    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.theme === (settings.theme || 'light')) {
            btn.classList.add('active');
        }
    });
    
    // Add event listeners
    setupSettingsListeners();
}

function setupSettingsListeners() {
    // Theme selection
    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.addEventListener('click', function() {
            const theme = this.dataset.theme;
            applyTheme(theme);
            
            document.querySelectorAll('.theme-option').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const settings = store.getSettings();
            settings.theme = theme;
            store.saveSettings(settings);
        });
    });
    
    // Save settings on change
    ['defaultCurrency', 'exchangeRate', 'customsThreshold', 'vatRate', 'customsRate', 'fontSize', 'density'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', saveCurrentSettings);
        }
    });
    
    ['enableCustoms', 'enableNotifications', 'priceDropAlerts', 'reminderAlerts', 'showImages'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', saveCurrentSettings);
        }
    });
}

function saveCurrentSettings() {
    const settings = {
        defaultCurrency: document.getElementById('defaultCurrency').value,
        exchangeRate: parseFloat(document.getElementById('exchangeRate').value),
        enableCustoms: document.getElementById('enableCustoms').checked,
        customsThreshold: parseFloat(document.getElementById('customsThreshold').value),
        vatRate: parseFloat(document.getElementById('vatRate').value),
        customsRate: parseFloat(document.getElementById('customsRate').value),
        enableNotifications: document.getElementById('enableNotifications').checked,
        priceDropAlerts: document.getElementById('priceDropAlerts').checked,
        reminderAlerts: document.getElementById('reminderAlerts').checked,
        fontSize: parseInt(document.getElementById('fontSize').value),
        density: document.getElementById('density').value,
        showImages: document.getElementById('showImages').checked,
        theme: store.getSettings().theme || 'light'
    };
    
    store.saveSettings(settings);
    applySettingsToUI(settings);
    showToast('ההגדרות נשמרו', 'success');
}

function applySettingsToUI(settings) {
    document.body.style.fontSize = `${settings.fontSize}px`;
    document.body.setAttribute('data-density', settings.density);
}

function applyTheme(theme) {
    document.body.removeAttribute('data-theme');
    document.body.classList.remove('dark-theme');
    
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
    } else if (theme !== 'light') {
        document.body.setAttribute('data-theme', theme);
    }
    
    localStorage.setItem('theme', theme);
}

// ===== Data Management =====
function exportAllData() {
    const data = store.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
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
    document.getElementById('importFile').click();
}

document.getElementById('importFile')?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const data = JSON.parse(event.target.result);
            store.importAll(data);
            
            showToast('הנתונים יובאו בהצלחה!', 'success');
            
            // Refresh all pages
            renderDashboard();
            renderProfiles();
            renderProducts();
            renderFavorites();
            renderReports();
            achievementsSystem.renderAchievementsPage();
            
        } catch (error) {
            console.error('Import error:', error);
            showToast('שגיאה בייבוא הנתונים', 'error');
        }
    };
    reader.readAsText(file);
});

function downloadQRBackup() {
    const data = store.exportAll();
    const dataStr = JSON.stringify(data);
    
    if (dataStr.length > 2000) {
        showToast('הנתונים גדולים מדי ל-QR. השתמש בייצוא רגיל.', 'warning');
        return;
    }
    
    const modal = document.getElementById('qrDisplayModal');
    const qrContainer = document.getElementById('productQRCode');
    
    qrContainer.innerHTML = '';
    
    if (typeof QRCode !== 'undefined') {
        new QRCode(qrContainer, {
            text: dataStr,
            width: 512,
            height: 512,
            correctLevel: QRCode.CorrectLevel.L
        });
        
        modal.classList.add('active');
        showToast('סרוק QR זה כדי לשחזר את הנתונים', 'info');
    }
}

function clearAllData() {
    if (!confirm('האם אתה בטוח שברצונך למחוק את כל הנתונים? פעולה זו לא ניתנת לביטול!')) return;
    
    if (!confirm('בטוח בטוח? כל המוצרים, הפרופילים וההגדרות יימחקו!')) return;
    
    localStorage.clear();
    location.reload();
}

function exportTextReport() {
    // Export comprehensive report as text
    const report = generateTextReport();
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = `aliexpress-tracker-report-${Date.now()}.txt`;
    link.click();
    
    URL.revokeObjectURL(url);
    showToast('הדוח יוצא בהצלחה!', 'success');
}

function generateTextReport() {
    const products = store.getProducts();
    const favorites = store.getFavorites();
    const profiles = store.getProfiles();
    const totalSavings = store.getTotalSavings();
    
    let report = '=== AliExpress Smart Tracker - דוח מלא ===\n\n';
    report += `תאריך: ${new Date().toLocaleString('he-IL')}\n\n`;
    
    report += `--- סטטיסטיקות כלליות ---\n`;
    report += `פרופילי חיפוש: ${profiles.length}\n`;
    report += `מוצרים מושווים: ${products.length}\n`;
    report += `מוצרים מועדפים: ${favorites.length}\n`;
    report += `חיסכון כולל: $${totalSavings.toFixed(2)}\n\n`;
    
    if (products.length > 0) {
        report += `--- מוצרים מושווים ---\n`;
        products.forEach((p, i) => {
            report += `${i + 1}. ${p.name}\n`;
            report += `   מחיר: $${p.price} | משלוח: $${p.shippingCost || 0} | סה"כ: $${p.realPrice.toFixed(2)}\n`;
            report += `   דירוג: ${p.rating} ⭐ | הזמנות: ${p.orders}\n`;
            report += `   ציון מומלץ: ${p.score}/100\n`;
            report += `   קישור: ${p.link}\n\n`;
        });
    }
    
    return report;
}

// ===== Navigation Enhancement =====
function navigateToPage(pageName) {
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === pageName) {
            item.classList.add('active');
        }
    });

    // Update pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(`${pageName}-page`).classList.add('active');

    currentPage = pageName;

    // Render page content
    switch(pageName) {
        case 'dashboard':
            renderDashboard();
            break;
        case 'criteria':
            renderProfiles();
            break;
        case 'compare':
            renderProducts();
            break;
        case 'favorites':
            renderFavorites();
            break;
        case 'reports':
            renderReports();
            break;
        case 'achievements':
            achievementsSystem.renderAchievementsPage();
            break;
        case 'settings':
            renderSettings();
            break;
    }
}

// ===== Initialize App =====
document.addEventListener('DOMContentLoaded', function() {
    initTheme();
    renderDashboard();
    applySettingsToUI(store.getSettings());
    
    // Request notification permission if enabled
    if (store.getSettings().enableNotifications && 'Notification' in window) {
        Notification.requestPermission();
    }
});
