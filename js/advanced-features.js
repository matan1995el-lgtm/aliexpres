// ===============================================
// Advanced Features for AliExpress Smart Tracker
// Version: 2.1.0
// ===============================================

// ==========================================
// 1. AUTO DARK MODE - זיהוי אוטומטי של מצב כהה
// ==========================================

class AutoThemeManager {
    constructor() {
        this.settings = null;
        this.init();
    }

    init() {
        // בדוק אם store זמין
        if (typeof store === 'undefined') {
            console.warn('Store not available yet, retrying...');
            setTimeout(() => this.init(), 100);
            return;
        }

        this.settings = store.getSettings();

        // זיהוי העדפת מערכת
        if (this.settings.autoTheme !== false) {
            this.detectSystemPreference();
        }

        // זיהוי שינויים בהעדפת מערכת
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (this.settings.autoTheme !== false) {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });

        // מצב לילה אוטומטי לפי שעה (22:00-06:00)
        if (this.settings.autoNightMode !== false) {
            this.checkTimeBasedTheme();
            // בדוק כל שעה
            setInterval(() => this.checkTimeBasedTheme(), 60 * 60 * 1000);
        }
    }

    detectSystemPreference() {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.applyTheme(prefersDark ? 'dark' : 'light');
    }

    checkTimeBasedTheme() {
        const hour = new Date().getHours();
        const isNightTime = hour >= 22 || hour < 6;
        
        if (isNightTime && !document.body.classList.contains('dark-theme')) {
            this.applyTheme('dark');
            showToast('🌙 מצב לילה הופעל אוטומטית', 'info');
        } else if (!isNightTime && document.body.classList.contains('dark-theme') && this.settings.currentTheme === 'dark') {
            this.applyTheme('light');
            showToast('☀️ מצב יום הופעל אוטומטית', 'info');
        }
    }

    applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
        this.settings.currentTheme = theme;
        store.saveSettings(this.settings);
    }
}

// ==========================================
// 2. ADVANCED SEARCH - חיפוש גלובלי מתקדם
// ==========================================

class AdvancedSearch {
    constructor() {
        this.searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        this.savedSearches = JSON.parse(localStorage.getItem('savedSearches') || '[]');
    }

    // חיפוש גלובלי בכל הנתונים
    globalSearch(query) {
        const results = {
            products: [],
            favorites: [],
            profiles: []
        };

        const lowerQuery = query.toLowerCase();

        // חיפוש במוצרים
        const products = store.getProducts();
        results.products = products.filter(p => 
            p.name.toLowerCase().includes(lowerQuery) ||
            (p.category && p.category.toLowerCase().includes(lowerQuery)) ||
            (p.notes && p.notes.toLowerCase().includes(lowerQuery))
        );

        // חיפוש במועדפים
        const favorites = store.getFavorites();
        results.favorites = favorites.filter(f => 
            f.name.toLowerCase().includes(lowerQuery) ||
            (f.tags && f.tags.some(t => t.toLowerCase().includes(lowerQuery)))
        );

        // חיפוש בפרופילים
        const profiles = store.getProfiles();
        results.profiles = profiles.filter(p => 
            p.name.toLowerCase().includes(lowerQuery) ||
            (p.category && p.category.toLowerCase().includes(lowerQuery))
        );

        // שמור בהיסטוריה
        this.addToHistory(query, results);

        return results;
    }

    // סינון מתקדם
    advancedFilter(options) {
        let products = store.getProducts();

        // סינון לפי טווח מחירים
        if (options.minPrice !== undefined) {
            products = products.filter(p => p.realPrice >= options.minPrice);
        }
        if (options.maxPrice !== undefined) {
            products = products.filter(p => p.realPrice <= options.maxPrice);
        }

        // סינון לפי דירוג
        if (options.minRating !== undefined) {
            products = products.filter(p => p.rating >= options.minRating);
        }

        // סינון לפי קטגוריה
        if (options.category) {
            products = products.filter(p => p.category === options.category);
        }

        // סינון לפי תגיות
        if (options.badges && options.badges.length > 0) {
            products = products.filter(p => {
                const badges = this.getProductBadges(p);
                return options.badges.some(b => badges.includes(b));
            });
        }

        // מיון
        if (options.sortBy) {
            products = this.sortProducts(products, options.sortBy);
        }

        return products;
    }

    getProductBadges(product) {
        const badges = [];
        const avgPrice = store.getProducts().reduce((sum, p) => sum + p.realPrice, 0) / store.getProducts().length;
        
        if (product.realPrice < avgPrice * 0.8) badges.push('hot');
        if (product.deliveryDays <= 10) badges.push('fast');
        if (product.score >= 85) badges.push('recommended');
        if (product.orders > 10000) badges.push('bestseller');
        if (product.rating < 4.0) badges.push('warning');
        if (product.orders < 100) badges.push('new');
        
        return badges;
    }

    sortProducts(products, sortBy) {
        const sortFunctions = {
            'price-asc': (a, b) => a.realPrice - b.realPrice,
            'price-desc': (a, b) => b.realPrice - a.realPrice,
            'rating-desc': (a, b) => b.rating - a.rating,
            'orders-desc': (a, b) => b.orders - a.orders,
            'score-desc': (a, b) => b.score - a.score
        };

        return products.sort(sortFunctions[sortBy] || sortFunctions['score-desc']);
    }

    // שמור חיפוש
    saveSearch(name, query, filters) {
        const savedSearch = {
            id: Date.now().toString(),
            name,
            query,
            filters,
            createdAt: Date.now()
        };

        this.savedSearches.push(savedSearch);
        localStorage.setItem('savedSearches', JSON.stringify(this.savedSearches));
        return savedSearch;
    }

    // טען חיפוש שמור
    loadSavedSearch(id) {
        return this.savedSearches.find(s => s.id === id);
    }

    // הסטוריית חיפושים
    addToHistory(query, results) {
        const historyItem = {
            query,
            timestamp: Date.now(),
            resultsCount: results.products.length + results.favorites.length + results.profiles.length
        };

        this.searchHistory.unshift(historyItem);
        if (this.searchHistory.length > 20) {
            this.searchHistory = this.searchHistory.slice(0, 20);
        }

        localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
    }

    getHistory() {
        return this.searchHistory;
    }

    clearHistory() {
        this.searchHistory = [];
        localStorage.removeItem('searchHistory');
    }
}

// ==========================================
// 3. IMAGE GALLERY - גלריית תמונות למוצר
// ==========================================

class ImageGallery {
    constructor() {
        this.currentIndex = 0;
        this.images = [];
    }

    // הוסף תמונות למוצר
    addImage(productId, imageUrl) {
        const products = store.getProducts();
        const product = products.find(p => p.id === productId);
        
        if (product) {
            if (!product.images) product.images = [];
            product.images.push(imageUrl);
            store.saveProducts(products);
            return true;
        }
        return false;
    }

    // הסר תמונה
    removeImage(productId, imageIndex) {
        const products = store.getProducts();
        const product = products.find(p => p.id === productId);
        
        if (product && product.images) {
            product.images.splice(imageIndex, 1);
            store.saveProducts(products);
            return true;
        }
        return false;
    }

    // הצג גלריה
    show(productId) {
        const products = store.getProducts();
        const product = products.find(p => p.id === productId);
        
        if (!product) return;

        this.images = product.images || [product.image];
        this.currentIndex = 0;

        this.createGalleryModal();
        this.updateDisplay();
    }

    createGalleryModal() {
        // בדוק אם כבר קיים
        let modal = document.getElementById('imageGalleryModal');
        if (modal) {
            modal.style.display = 'flex';
            return;
        }

        // צור מודל חדש
        modal = document.createElement('div');
        modal.id = 'imageGalleryModal';
        modal.className = 'modal-overlay gallery-modal';
        modal.innerHTML = `
            <div class="gallery-container">
                <button class="gallery-close" onclick="imageGallery.close()">
                    <i class="fas fa-times"></i>
                </button>
                
                <button class="gallery-nav gallery-prev" onclick="imageGallery.prev()">
                    <i class="fas fa-chevron-right"></i>
                </button>
                
                <div class="gallery-image-wrapper">
                    <img id="galleryImage" src="" alt="Product Image">
                    <div class="gallery-zoom-controls">
                        <button onclick="imageGallery.zoomIn()"><i class="fas fa-search-plus"></i></button>
                        <button onclick="imageGallery.zoomOut()"><i class="fas fa-search-minus"></i></button>
                        <button onclick="imageGallery.resetZoom()"><i class="fas fa-expand"></i></button>
                    </div>
                </div>
                
                <button class="gallery-nav gallery-next" onclick="imageGallery.next()">
                    <i class="fas fa-chevron-left"></i>
                </button>
                
                <div class="gallery-counter">
                    <span id="galleryCounter">1 / 1</span>
                </div>
                
                <div class="gallery-thumbnails" id="galleryThumbnails"></div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    updateDisplay() {
        const image = document.getElementById('galleryImage');
        const counter = document.getElementById('galleryCounter');
        const thumbnails = document.getElementById('galleryThumbnails');

        if (image && this.images.length > 0) {
            image.src = this.images[this.currentIndex];
            counter.textContent = `${this.currentIndex + 1} / ${this.images.length}`;

            // עדכן תמונות ממוזערות
            thumbnails.innerHTML = this.images.map((img, idx) => `
                <img src="${img}" 
                     class="gallery-thumbnail ${idx === this.currentIndex ? 'active' : ''}"
                     onclick="imageGallery.goTo(${idx})">
            `).join('');
        }
    }

    next() {
        this.currentIndex = (this.currentIndex + 1) % this.images.length;
        this.updateDisplay();
    }

    prev() {
        this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
        this.updateDisplay();
    }

    goTo(index) {
        this.currentIndex = index;
        this.updateDisplay();
    }

    zoomIn() {
        const image = document.getElementById('galleryImage');
        const currentScale = parseFloat(image.style.transform?.match(/scale\(([\d.]+)\)/)?.[1] || 1);
        image.style.transform = `scale(${Math.min(currentScale + 0.2, 3)})`;
    }

    zoomOut() {
        const image = document.getElementById('galleryImage');
        const currentScale = parseFloat(image.style.transform?.match(/scale\(([\d.]+)\)/)?.[1] || 1);
        image.style.transform = `scale(${Math.max(currentScale - 0.2, 0.5)})`;
    }

    resetZoom() {
        const image = document.getElementById('galleryImage');
        image.style.transform = 'scale(1)';
    }

    close() {
        const modal = document.getElementById('imageGalleryModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
}

// ==========================================
// 4. PRODUCT NOTES - הערות ותגובות למוצרים
// ==========================================

class ProductNotes {
    constructor() {
        this.notes = JSON.parse(localStorage.getItem('productNotes') || '{}');
    }

    // הוסף הערה
    addNote(productId, text, tags = []) {
        if (!this.notes[productId]) {
            this.notes[productId] = [];
        }

        const note = {
            id: Date.now().toString(),
            text,
            tags,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        this.notes[productId].push(note);
        this.save();
        return note;
    }

    // ערוך הערה
    editNote(productId, noteId, text, tags) {
        const productNotes = this.notes[productId];
        if (!productNotes) return false;

        const note = productNotes.find(n => n.id === noteId);
        if (note) {
            note.text = text;
            note.tags = tags;
            note.updatedAt = Date.now();
            this.save();
            return true;
        }
        return false;
    }

    // מחק הערה
    deleteNote(productId, noteId) {
        const productNotes = this.notes[productId];
        if (!productNotes) return false;

        const index = productNotes.findIndex(n => n.id === noteId);
        if (index !== -1) {
            productNotes.splice(index, 1);
            this.save();
            return true;
        }
        return false;
    }

    // קבל הערות למוצר
    getNotes(productId) {
        return this.notes[productId] || [];
    }

    // קבל כל ההערות
    getAllNotes() {
        return this.notes;
    }

    save() {
        localStorage.setItem('productNotes', JSON.stringify(this.notes));
    }
}

// ==========================================
// 5. ADVANCED REMINDERS - תזכורות מתקדמות
// ==========================================

class AdvancedReminders {
    constructor() {
        this.reminders = JSON.parse(localStorage.getItem('advancedReminders') || '[]');
        this.checkReminders();
        // בדוק כל דקה
        setInterval(() => this.checkReminders(), 60 * 1000);
    }

    // הוסף תזכורת
    addReminder(options) {
        const reminder = {
            id: Date.now().toString(),
            productId: options.productId,
            title: options.title,
            message: options.message,
            type: options.type || 'once', // once, daily, weekly, monthly, event
            triggerDate: options.triggerDate,
            eventType: options.eventType, // blackfriday, 1111, custom
            repeat: options.repeat || false,
            snoozed: false,
            snoozeUntil: null,
            active: true,
            createdAt: Date.now()
        };

        this.reminders.push(reminder);
        this.save();
        
        // בקש הרשאה להתראות
        this.requestNotificationPermission();
        
        return reminder;
    }

    // עדכן תזכורת
    updateReminder(id, updates) {
        const reminder = this.reminders.find(r => r.id === id);
        if (reminder) {
            Object.assign(reminder, updates);
            this.save();
            return true;
        }
        return false;
    }

    // מחק תזכורת
    deleteReminder(id) {
        const index = this.reminders.findIndex(r => r.id === id);
        if (index !== -1) {
            this.reminders.splice(index, 1);
            this.save();
            return true;
        }
        return false;
    }

    // Snooze תזכורת
    snooze(id, minutes = 60) {
        const reminder = this.reminders.find(r => r.id === id);
        if (reminder) {
            reminder.snoozed = true;
            reminder.snoozeUntil = Date.now() + (minutes * 60 * 1000);
            this.save();
            return true;
        }
        return false;
    }

    // בדוק תזכורות
    checkReminders() {
        const now = Date.now();

        this.reminders.forEach(reminder => {
            if (!reminder.active) return;

            // בדוק snooze
            if (reminder.snoozed && reminder.snoozeUntil > now) return;
            if (reminder.snoozed && reminder.snoozeUntil <= now) {
                reminder.snoozed = false;
                reminder.snoozeUntil = null;
            }

            // בדוק אם הגיע הזמן
            if (reminder.triggerDate <= now) {
                this.triggerReminder(reminder);
            }
        });
    }

    // הפעל תזכורת
    triggerReminder(reminder) {
        // שלח התראה
        this.sendNotification(reminder);

        // טפל בחזרות
        if (reminder.type === 'daily') {
            reminder.triggerDate += 24 * 60 * 60 * 1000; // יום אחד
        } else if (reminder.type === 'weekly') {
            reminder.triggerDate += 7 * 24 * 60 * 60 * 1000; // שבוע
        } else if (reminder.type === 'monthly') {
            reminder.triggerDate += 30 * 24 * 60 * 60 * 1000; // חודש
        } else {
            reminder.active = false; // פעם אחת - השבת
        }

        this.save();
    }

    // שלח התראה
    sendNotification(reminder) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(reminder.title, {
                body: reminder.message,
                icon: '/icons/icon-192.png',
                badge: '/icons/icon-72.png',
                tag: reminder.id,
                requireInteraction: true
            });
        }

        // הצג גם toast
        showToast(`🔔 ${reminder.title}: ${reminder.message}`, 'info');
    }

    // בקש הרשאה להתראות
    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }

    // אירועים מיוחדים
    addEventReminder(eventType) {
        const events = {
            blackfriday: { date: this.getNextBlackFriday(), title: 'Black Friday מגיע!', message: 'זמן מצוין לקניות!' },
            singles11: { date: this.getNext1111(), title: 'יום הרווקים 11.11!', message: 'המבצעים הכי גדולים בשנה!' },
            newyear: { date: this.getNextNewYear(), title: 'שנה חדשה!', message: 'מבצעי סוף שנה!' }
        };

        const event = events[eventType];
        if (event) {
            return this.addReminder({
                title: event.title,
                message: event.message,
                triggerDate: event.date,
                type: 'event',
                eventType: eventType
            });
        }
    }

    getNextBlackFriday() {
        // Black Friday - יום שישי הרביעי בנובמבר
        const now = new Date();
        const year = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();
        const november = new Date(year, 10, 1); // נובמבר
        
        // מצא יום שישי הרביעי
        let fridays = 0;
        let date = new Date(november);
        while (fridays < 4) {
            if (date.getDay() === 5) fridays++;
            if (fridays < 4) date.setDate(date.getDate() + 1);
        }
        
        return date.getTime();
    }

    getNext1111() {
        const now = new Date();
        const year = now.getMonth() === 10 && now.getDate() > 11 ? now.getFullYear() + 1 : now.getFullYear();
        return new Date(year, 10, 11).getTime(); // 11 בנובמבר
    }

    getNextNewYear() {
        const now = new Date();
        const year = now.getMonth() === 11 && now.getDate() > 31 ? now.getFullYear() + 1 : now.getFullYear();
        return new Date(year, 11, 31).getTime(); // 31 בדצמבר
    }

    getReminders() {
        return this.reminders.filter(r => r.active);
    }

    save() {
        localStorage.setItem('advancedReminders', JSON.stringify(this.reminders));
    }
}

// ==========================================
// 6. AUTO BACKUP - גיבוי אוטומטי
// ==========================================

class AutoBackup {
    constructor() {
        this.backups = JSON.parse(localStorage.getItem('autoBackups') || '[]');
        this.maxBackups = 10;
        this.lastBackup = parseInt(localStorage.getItem('lastBackup') || '0');
        
        // גבה כל 5 דקות
        this.startAutoBackup();
    }

    startAutoBackup() {
        // גיבוי ראשוני
        this.createBackup('auto');
        
        // גבה כל 5 דקות
        setInterval(() => {
            const now = Date.now();
            if (now - this.lastBackup > 5 * 60 * 1000) {
                this.createBackup('auto');
            }
        }, 5 * 60 * 1000);
    }

    createBackup(type = 'manual') {
        const backup = {
            id: Date.now().toString(),
            type,
            timestamp: Date.now(),
            data: {
                products: store.getProducts(),
                favorites: store.getFavorites(),
                profiles: store.getProfiles(),
                settings: store.getSettings(),
                achievements: achievementsSystem?.achievements || {},
                notes: productNotes?.notes || {},
                reminders: advancedReminders?.reminders || []
            }
        };

        this.backups.unshift(backup);
        
        // שמור רק את ה-10 גיבויים האחרונים
        if (this.backups.length > this.maxBackups) {
            this.backups = this.backups.slice(0, this.maxBackups);
        }

        localStorage.setItem('autoBackups', JSON.stringify(this.backups));
        this.lastBackup = Date.now();
        localStorage.setItem('lastBackup', this.lastBackup.toString());

        if (type === 'manual') {
            showToast('✅ גיבוי נשמר בהצלחה!', 'success');
        }

        return backup;
    }

    restoreBackup(backupId) {
        const backup = this.backups.find(b => b.id === backupId);
        if (!backup) return false;

        try {
            // שחזר את כל הנתונים
            if (backup.data.products) store.saveProducts(backup.data.products);
            if (backup.data.favorites) store.saveFavorites(backup.data.favorites);
            if (backup.data.profiles) store.saveProfiles(backup.data.profiles);
            if (backup.data.settings) store.saveSettings(backup.data.settings);
            if (backup.data.achievements && achievementsSystem) {
                achievementsSystem.achievements = backup.data.achievements;
                achievementsSystem.saveAchievements();
            }
            if (backup.data.notes && productNotes) {
                productNotes.notes = backup.data.notes;
                productNotes.save();
            }
            if (backup.data.reminders && advancedReminders) {
                advancedReminders.reminders = backup.data.reminders;
                advancedReminders.save();
            }

            showToast('✅ הנתונים שוחזרו בהצלחה!', 'success');
            setTimeout(() => location.reload(), 1000);
            return true;
        } catch (error) {
            showToast('❌ שגיאה בשחזור הנתונים', 'error');
            return false;
        }
    }

    getBackups() {
        return this.backups;
    }

    deleteBackup(backupId) {
        const index = this.backups.findIndex(b => b.id === backupId);
        if (index !== -1) {
            this.backups.splice(index, 1);
            localStorage.setItem('autoBackups', JSON.stringify(this.backups));
            return true;
        }
        return false;
    }

    clearOldBackups() {
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        this.backups = this.backups.filter(b => b.timestamp > oneWeekAgo || b.type === 'manual');
        localStorage.setItem('autoBackups', JSON.stringify(this.backups));
    }
}

// ==========================================
// 7. EXCEL ADVANCED - ייצוא/ייבוא Excel מתקדם
// ==========================================

class ExcelAdvanced {
    // ייצוא עם עיצוב מלא
    exportToExcel(data, filename = 'products') {
        let csv = '\uFEFF'; // UTF-8 BOM

        // כותרות מעוצבות
        const headers = ['שם המוצר', 'מחיר', 'משלוח', 'מחיר כולל', 'דירוג', 'הזמנות', 'ציון', 'קטגוריה', 'קישור'];
        csv += headers.join(',') + '\n';

        // נתונים
        data.forEach(product => {
            const row = [
                `"${product.name}"`,
                product.price,
                product.shipping,
                product.realPrice,
                product.rating,
                product.orders,
                product.score,
                `"${product.category || ''}"`,
                `"${product.link || ''}"`
            ];
            csv += row.join(',') + '\n';
        });

        // הורד קובץ
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        showToast('✅ Excel ייצא בהצלחה!', 'success');
    }

    // ייבוא מ-Excel
    importFromExcel(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const csv = e.target.result;
                    const lines = csv.split('\n');
                    const products = [];

                    // דלג על כותרת
                    for (let i = 1; i < lines.length; i++) {
                        const line = lines[i].trim();
                        if (!line) continue;

                        const values = this.parseCSVLine(line);
                        if (values.length < 8) continue;

                        const product = {
                            id: Date.now().toString() + i,
                            name: values[0],
                            price: parseFloat(values[1]) || 0,
                            shipping: parseFloat(values[2]) || 0,
                            realPrice: parseFloat(values[3]) || 0,
                            rating: parseFloat(values[4]) || 0,
                            orders: parseInt(values[5]) || 0,
                            score: parseFloat(values[6]) || 0,
                            category: values[7] || '',
                            link: values[8] || '',
                            createdAt: Date.now()
                        };

                        products.push(product);
                    }

                    resolve(products);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('שגיאה בקריאת הקובץ'));
            reader.readAsText(file);
        });
    }

    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }

        values.push(current.trim());
        return values;
    }
}

// ==========================================
// אתחול כל המערכות החדשות
// ==========================================

let autoThemeManager;
let advancedSearch;
let imageGallery;
let productNotes;
let advancedReminders;
let autoBackup;
let excelAdvanced;

// אתחל כשהדף נטען
document.addEventListener('DOMContentLoaded', () => {
    try {
        autoThemeManager = new AutoThemeManager();
        advancedSearch = new AdvancedSearch();
        imageGallery = new ImageGallery();
        productNotes = new ProductNotes();
        advancedReminders = new AdvancedReminders();
        autoBackup = new AutoBackup();
        excelAdvanced = new ExcelAdvanced();

        console.log('✅ Advanced Features initialized successfully!');
    } catch (error) {
        console.error('❌ Error initializing advanced features:', error);
    }
});
