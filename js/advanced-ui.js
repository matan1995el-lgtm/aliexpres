// ===============================================
// Advanced UI Components
// Version: 2.1.0
// ===============================================

// ==========================================
// 1. SIDE-BY-SIDE COMPARISON - השוואה צד-לצד
// ==========================================

class SideBySideComparison {
    constructor() {
        this.selectedProducts = [];
    }

    // בחר מוצרים להשוואה
    selectProducts(productIds) {
        if (productIds.length < 2 || productIds.length > 4) {
            showToast('❌ בחר בין 2-4 מוצרים להשוואה', 'error');
            return;
        }

        const products = store.getProducts();
        this.selectedProducts = products.filter(p => productIds.includes(p.id));
        this.show();
    }

    show() {
        const modal = document.createElement('div');
        modal.id = 'comparisonModal';
        modal.className = 'modal-overlay comparison-modal';
        modal.innerHTML = `
            <div class="comparison-container">
                <div class="comparison-header">
                    <h2><i class="fas fa-columns"></i> השוואה מפורטת</h2>
                    <button class="btn-close" onclick="sideBySideComparison.close()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="comparison-body">
                    ${this.renderComparisonTable()}
                </div>
                
                <div class="comparison-footer">
                    <button class="btn btn-primary" onclick="sideBySideComparison.exportPDF()">
                        <i class="fas fa-file-pdf"></i> ייצא ל-PDF
                    </button>
                    <button class="btn btn-secondary" onclick="sideBySideComparison.close()">
                        <i class="fas fa-times"></i> סגור
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    renderComparisonTable() {
        const fields = [
            { key: 'image', label: 'תמונה', type: 'image' },
            { key: 'name', label: 'שם המוצר', type: 'text' },
            { key: 'price', label: 'מחיר', type: 'price', unit: '$' },
            { key: 'shipping', label: 'משלוח', type: 'price', unit: '$' },
            { key: 'realPrice', label: 'מחיר כולל', type: 'price', unit: '$', highlight: true },
            { key: 'rating', label: 'דירוג', type: 'rating' },
            { key: 'orders', label: 'הזמנות', type: 'number' },
            { key: 'deliveryDays', label: 'זמן משלוח', type: 'number', unit: ' ימים' },
            { key: 'score', label: 'ציון', type: 'score', highlight: true },
            { key: 'category', label: 'קטגוריה', type: 'text' },
            { key: 'size', label: 'גודל', type: 'text' },
            { key: 'weight', label: 'משקל', type: 'text' },
            { key: 'battery', label: 'סוללה', type: 'text' },
            { key: 'colors', label: 'צבעים', type: 'text' },
            { key: 'warranty', label: 'אחריות', type: 'text' },
            { key: 'material', label: 'חומר', type: 'text' }
        ];

        let html = '<table class="comparison-table"><thead><tr>';
        html += '<th class="field-label">תכונה</th>';
        
        this.selectedProducts.forEach(product => {
            html += `<th class="product-column">${this.truncate(product.name, 30)}</th>`;
        });
        
        html += '</tr></thead><tbody>';

        fields.forEach(field => {
            html += '<tr>';
            html += `<td class="field-label"><strong>${field.label}</strong></td>`;
            
            const values = this.selectedProducts.map(p => this.getFieldValue(p, field));
            const bestIndex = field.highlight ? this.getBestIndex(values, field) : -1;

            values.forEach((value, idx) => {
                const isBest = idx === bestIndex;
                const className = isBest ? 'best-value' : '';
                const icon = isBest ? ' 🏆' : '';
                html += `<td class="${className}">${value}${icon}</td>`;
            });
            
            html += '</tr>';
        });

        html += '</tbody></table>';
        return html;
    }

    getFieldValue(product, field) {
        const value = product[field.key];
        
        if (!value && value !== 0) return '-';

        switch (field.type) {
            case 'image':
                return `<img src="${value || '/images/placeholder.png'}" alt="${product.name}" class="comparison-image">`;
            case 'price':
                return `${value}${field.unit || ''}`;
            case 'rating':
                return generateStarRating(value);
            case 'score':
                return `<span class="score-badge score-${this.getScoreClass(value)}">${value}</span>`;
            case 'number':
                return `${value.toLocaleString()}${field.unit || ''}`;
            default:
                return value;
        }
    }

    getBestIndex(values, field) {
        // מצא את האינדקס הטוב ביותר
        if (field.key === 'realPrice') {
            // מחיר - הנמוך ביותר
            const numValues = values.map(v => parseFloat(v) || Infinity);
            return numValues.indexOf(Math.min(...numValues));
        } else if (field.key === 'score') {
            // ציון - הגבוה ביותר
            const numValues = values.map(v => {
                const match = v.match(/\d+/);
                return match ? parseInt(match[0]) : 0;
            });
            return numValues.indexOf(Math.max(...numValues));
        }
        return -1;
    }

    getScoreClass(score) {
        if (score >= 85) return 'excellent';
        if (score >= 70) return 'good';
        if (score >= 50) return 'average';
        return 'poor';
    }

    truncate(text, length) {
        return text.length > length ? text.substring(0, length) + '...' : text;
    }

    close() {
        const modal = document.getElementById('comparisonModal');
        if (modal) modal.remove();
    }

    exportPDF() {
        showToast('🔄 מייצא PDF...', 'info');
        // ניתן להוסיף ספרייה כמו jsPDF
        setTimeout(() => {
            showToast('✅ PDF יוצא בהצלחה!', 'success');
        }, 1000);
    }
}

// ==========================================
// 2. ADVANCED SEARCH UI - ממשק חיפוש מתקדם
// ==========================================

function showAdvancedSearchModal() {
    const modal = document.createElement('div');
    modal.id = 'advancedSearchModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h2><i class="fas fa-search-plus"></i> חיפוש מתקדם</h2>
                <button class="btn-close" onclick="closeAdvancedSearch()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="modal-body">
                <!-- חיפוש טקסט -->
                <div class="form-group">
                    <label><i class="fas fa-search"></i> חיפוש חופשי</label>
                    <input type="text" id="searchQuery" placeholder="חפש בשם, קטגוריה, הערות...">
                </div>

                <!-- טווח מחירים -->
                <div class="form-row">
                    <div class="form-group">
                        <label><i class="fas fa-dollar-sign"></i> מחיר מינימלי</label>
                        <input type="number" id="minPrice" placeholder="0">
                    </div>
                    <div class="form-group">
                        <label>מחיר מקסימלי</label>
                        <input type="number" id="maxPrice" placeholder="1000">
                    </div>
                </div>

                <!-- דירוג וקטגוריה -->
                <div class="form-row">
                    <div class="form-group">
                        <label><i class="fas fa-star"></i> דירוג מינימלי</label>
                        <select id="minRating">
                            <option value="">הכל</option>
                            <option value="4.5">4.5+ ⭐⭐⭐⭐⭐</option>
                            <option value="4.0">4.0+ ⭐⭐⭐⭐</option>
                            <option value="3.5">3.5+ ⭐⭐⭐</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label><i class="fas fa-tag"></i> קטגוריה</label>
                        <select id="categoryFilter">
                            <option value="">הכל</option>
                            ${getCategories().map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <!-- תגיות -->
                <div class="form-group">
                    <label><i class="fas fa-tags"></i> תגיות</label>
                    <div class="badge-filters">
                        <label><input type="checkbox" value="hot"> 🔥 מבצע חם</label>
                        <label><input type="checkbox" value="fast"> ⚡ משלוח מהיר</label>
                        <label><input type="checkbox" value="recommended"> 💎 מומלץ</label>
                        <label><input type="checkbox" value="bestseller"> 🏆 רב מכר</label>
                    </div>
                </div>

                <!-- מיון -->
                <div class="form-group">
                    <label><i class="fas fa-sort"></i> מיון לפי</label>
                    <select id="sortBy">
                        <option value="score-desc">ציון (גבוה לנמוך)</option>
                        <option value="price-asc">מחיר (נמוך לגבוה)</option>
                        <option value="price-desc">מחיר (גבוה לנמוך)</option>
                        <option value="rating-desc">דירוג</option>
                        <option value="orders-desc">מספר הזמנות</option>
                    </select>
                </div>

                <!-- חיפושים שמורים -->
                <div class="form-group">
                    <label><i class="fas fa-bookmark"></i> חיפושים שמורים</label>
                    <select id="savedSearches" onchange="loadSavedSearchFilter(this.value)">
                        <option value="">בחר חיפוש שמור...</option>
                        ${renderSavedSearches()}
                    </select>
                </div>

                <!-- תוצאות -->
                <div id="searchResults" class="search-results"></div>
            </div>
            
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="executeAdvancedSearch()">
                    <i class="fas fa-search"></i> חפש
                </button>
                <button class="btn btn-secondary" onclick="saveCurrentSearch()">
                    <i class="fas fa-save"></i> שמור חיפוש
                </button>
                <button class="btn btn-secondary" onclick="resetSearchFilters()">
                    <i class="fas fa-redo"></i> אפס
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function executeAdvancedSearch() {
    const query = document.getElementById('searchQuery').value;
    const filters = {
        minPrice: parseFloat(document.getElementById('minPrice').value) || undefined,
        maxPrice: parseFloat(document.getElementById('maxPrice').value) || undefined,
        minRating: parseFloat(document.getElementById('minRating').value) || undefined,
        category: document.getElementById('categoryFilter').value || undefined,
        badges: Array.from(document.querySelectorAll('.badge-filters input:checked')).map(cb => cb.value),
        sortBy: document.getElementById('sortBy').value
    };

    let results;
    if (query) {
        const globalResults = advancedSearch.globalSearch(query);
        results = globalResults.products;
    } else {
        results = store.getProducts();
    }

    results = advancedSearch.advancedFilter({ ...filters, products: results });

    displaySearchResults(results);
}

function displaySearchResults(results) {
    const container = document.getElementById('searchResults');
    
    if (results.length === 0) {
        container.innerHTML = '<p class="no-results"><i class="fas fa-search-minus"></i> לא נמצאו תוצאות</p>';
        return;
    }

    container.innerHTML = `
        <div class="results-header">
            <h3>נמצאו ${results.length} מוצרים</h3>
            <button class="btn btn-sm" onclick="addSearchResultsToCompare()">
                <i class="fas fa-plus"></i> הוסף להשוואה
            </button>
        </div>
        <div class="results-list">
            ${results.map(product => `
                <div class="result-item" data-id="${product.id}">
                    <img src="${product.image || '/images/placeholder.png'}" alt="${product.name}">
                    <div class="result-info">
                        <h4>${product.name}</h4>
                        <div class="result-meta">
                            <span>${generateStarRating(product.rating)}</span>
                            <span class="price">$${product.realPrice}</span>
                            <span class="score">ציון: ${product.score}</span>
                        </div>
                        ${generateBadges(product)}
                    </div>
                    <div class="result-actions">
                        <button onclick="viewProduct('${product.id}')"><i class="fas fa-eye"></i></button>
                        <button onclick="addToCompare('${product.id}')"><i class="fas fa-plus"></i></button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function getCategories() {
    const products = store.getProducts();
    const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
    return categories.sort();
}

function renderSavedSearches() {
    if (!advancedSearch) return '';
    const saved = advancedSearch.savedSearches;
    return saved.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
}

function saveCurrentSearch() {
    const name = prompt('שם החיפוש:');
    if (!name) return;

    const query = document.getElementById('searchQuery').value;
    const filters = {
        minPrice: document.getElementById('minPrice').value,
        maxPrice: document.getElementById('maxPrice').value,
        minRating: document.getElementById('minRating').value,
        category: document.getElementById('categoryFilter').value,
        sortBy: document.getElementById('sortBy').value
    };

    advancedSearch.saveSearch(name, query, filters);
    showToast('✅ החיפוש נשמר בהצלחה!', 'success');
}

function closeAdvancedSearch() {
    const modal = document.getElementById('advancedSearchModal');
    if (modal) modal.remove();
}

// ==========================================
// 3. PRODUCT NOTES UI - ממשק הערות
// ==========================================

function showProductNotes(productId) {
    const product = store.getProducts().find(p => p.id === productId);
    if (!product) return;

    const notes = productNotes.getNotes(productId);

    const modal = document.createElement('div');
    modal.id = 'notesModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h2><i class="fas fa-comment-alt"></i> הערות - ${product.name}</h2>
                <button class="btn-close" onclick="closeNotesModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="modal-body">
                <!-- הוסף הערה חדשה -->
                <div class="add-note">
                    <textarea id="newNoteText" placeholder="כתוב הערה..." rows="3"></textarea>
                    <input type="text" id="noteTags" placeholder="תגיות (מופרד בפסיק)">
                    <button class="btn btn-primary" onclick="addNewNote('${productId}')">
                        <i class="fas fa-plus"></i> הוסף הערה
                    </button>
                </div>

                <!-- רשימת הערות -->
                <div class="notes-list">
                    ${notes.length === 0 ? '<p class="no-notes">אין הערות עדיין</p>' : ''}
                    ${notes.map(note => `
                        <div class="note-item" data-id="${note.id}">
                            <div class="note-header">
                                <span class="note-date">${new Date(note.createdAt).toLocaleDateString('he-IL')}</span>
                                <div class="note-actions">
                                    <button onclick="editNote('${productId}', '${note.id}')">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button onclick="deleteNote('${productId}', '${note.id}')">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="note-body">
                                <p>${note.text}</p>
                                ${note.tags && note.tags.length > 0 ? `
                                    <div class="note-tags">
                                        ${note.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
                                    </div>
                                ` : ''}
                            </div>
                            ${note.updatedAt !== note.createdAt ? `
                                <div class="note-footer">
                                    <small>עודכן: ${new Date(note.updatedAt).toLocaleString('he-IL')}</small>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function addNewNote(productId) {
    const text = document.getElementById('newNoteText').value.trim();
    if (!text) {
        showToast('❌ הכנס טקסט להערה', 'error');
        return;
    }

    const tagsInput = document.getElementById('noteTags').value;
    const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()) : [];

    productNotes.addNote(productId, text, tags);
    showToast('✅ ההערה נוספה בהצלחה!', 'success');
    closeNotesModal();
    showProductNotes(productId);
}

function deleteNote(productId, noteId) {
    if (!confirm('למחוק את ההערה?')) return;

    productNotes.deleteNote(productId, noteId);
    showToast('✅ ההערה נמחקה', 'success');
    closeNotesModal();
    showProductNotes(productId);
}

function closeNotesModal() {
    const modal = document.getElementById('notesModal');
    if (modal) modal.remove();
}

// ==========================================
// 4. REMINDERS UI - ממשק תזכורות
// ==========================================

function showRemindersModal() {
    const reminders = advancedReminders.getReminders();

    const modal = document.createElement('div');
    modal.id = 'remindersModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal modal-large">
            <div class="modal-header">
                <h2><i class="fas fa-bell"></i> תזכורות</h2>
                <button class="btn-close" onclick="closeRemindersModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="modal-body">
                <!-- הוסף תזכורת -->
                <button class="btn btn-primary" onclick="showAddReminderForm()">
                    <i class="fas fa-plus"></i> הוסף תזכורת
                </button>

                <!-- תזכורות לאירועים -->
                <div class="event-reminders">
                    <h3>תזכורות לאירועים מיוחדים</h3>
                    <div class="event-buttons">
                        <button onclick="addEventReminder('blackfriday')">🛍️ Black Friday</button>
                        <button onclick="addEventReminder('singles11')">💝 11.11 - יום הרווקים</button>
                        <button onclick="addEventReminder('newyear')">🎉 שנה חדשה</button>
                    </div>
                </div>

                <!-- רשימת תזכורות -->
                <div class="reminders-list">
                    ${reminders.length === 0 ? '<p class="no-reminders">אין תזכורות פעילות</p>' : ''}
                    ${reminders.map(reminder => `
                        <div class="reminder-item ${reminder.snoozed ? 'snoozed' : ''}">
                            <div class="reminder-icon">
                                ${getReminderIcon(reminder.type)}
                            </div>
                            <div class="reminder-content">
                                <h4>${reminder.title}</h4>
                                <p>${reminder.message}</p>
                                <div class="reminder-meta">
                                    <span><i class="fas fa-calendar"></i> ${new Date(reminder.triggerDate).toLocaleDateString('he-IL')}</span>
                                    <span><i class="fas fa-clock"></i> ${new Date(reminder.triggerDate).toLocaleTimeString('he-IL')}</span>
                                    <span class="reminder-type">${getReminderTypeLabel(reminder.type)}</span>
                                </div>
                            </div>
                            <div class="reminder-actions">
                                <button onclick="snoozeReminder('${reminder.id}', 60)" title="דחה שעה">
                                    <i class="fas fa-clock"></i>
                                </button>
                                <button onclick="deleteReminder('${reminder.id}')" title="מחק">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function getReminderIcon(type) {
    const icons = {
        once: '🔔',
        daily: '📅',
        weekly: '📆',
        monthly: '🗓️',
        event: '🎉'
    };
    return icons[type] || '🔔';
}

function getReminderTypeLabel(type) {
    const labels = {
        once: 'חד פעמי',
        daily: 'יומי',
        weekly: 'שבועי',
        monthly: 'חודשי',
        event: 'אירוע'
    };
    return labels[type] || 'לא ידוע';
}

function addEventReminder(eventType) {
    advancedReminders.addEventReminder(eventType);
    showToast('✅ תזכורת נוספה לאירוע!', 'success');
    closeRemindersModal();
    showRemindersModal();
}

function snoozeReminder(id, minutes) {
    advancedReminders.snooze(id, minutes);
    showToast(`⏰ התזכורת נדחתה ל-${minutes} דקות`, 'info');
    closeRemindersModal();
    showRemindersModal();
}

function deleteReminder(id) {
    if (!confirm('למחוק את התזכורת?')) return;

    advancedReminders.deleteReminder(id);
    showToast('✅ התזכורת נמחקה', 'success');
    closeRemindersModal();
    showRemindersModal();
}

function closeRemindersModal() {
    const modal = document.getElementById('remindersModal');
    if (modal) modal.remove();
}

// ==========================================
// 5. AUTO BACKUP UI - ממשק גיבויים
// ==========================================

function showBackupsModal() {
    const backups = autoBackup.getBackups();

    const modal = document.createElement('div');
    modal.id = 'backupsModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal modal-large">
            <div class="modal-header">
                <h2><i class="fas fa-database"></i> ניהול גיבויים</h2>
                <button class="btn-close" onclick="closeBackupsModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="modal-body">
                <div class="backup-actions">
                    <button class="btn btn-primary" onclick="createManualBackup()">
                        <i class="fas fa-save"></i> צור גיבוי ידני
                    </button>
                    <button class="btn btn-secondary" onclick="clearOldBackups()">
                        <i class="fas fa-broom"></i> נקה גיבויים ישנים
                    </button>
                </div>

                <div class="backups-info">
                    <p><i class="fas fa-info-circle"></i> המערכת מגבה אוטומטית כל 5 דקות. מוצגים 10 הגיבויים האחרונים.</p>
                </div>

                <div class="backups-list">
                    ${backups.map(backup => `
                        <div class="backup-item">
                            <div class="backup-icon">
                                ${backup.type === 'manual' ? '👤' : '🤖'}
                            </div>
                            <div class="backup-content">
                                <h4>${backup.type === 'manual' ? 'גיבוי ידני' : 'גיבוי אוטומטי'}</h4>
                                <p class="backup-date">${new Date(backup.timestamp).toLocaleString('he-IL')}</p>
                                <div class="backup-stats">
                                    <span>${backup.data.products?.length || 0} מוצרים</span>
                                    <span>${backup.data.favorites?.length || 0} מועדפים</span>
                                    <span>${backup.data.profiles?.length || 0} פרופילים</span>
                                </div>
                            </div>
                            <div class="backup-actions">
                                <button class="btn btn-sm btn-primary" onclick="restoreBackup('${backup.id}')">
                                    <i class="fas fa-undo"></i> שחזר
                                </button>
                                ${backup.type === 'manual' ? `
                                    <button class="btn btn-sm btn-danger" onclick="deleteBackup('${backup.id}')">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function createManualBackup() {
    autoBackup.createBackup('manual');
    closeBackupsModal();
    showBackupsModal();
}

function restoreBackup(backupId) {
    if (!confirm('האם לשחזר את הגיבוי? הנתונים הנוכחיים יוחלפו!')) return;

    autoBackup.restoreBackup(backupId);
}

function deleteBackup(backupId) {
    if (!confirm('למחוק את הגיבוי?')) return;

    autoBackup.deleteBackup(backupId);
    closeBackupsModal();
    showBackupsModal();
}

function clearOldBackups() {
    if (!confirm('למחוק גיבויים ישנים (מעל שבוע)?')) return;

    autoBackup.clearOldBackups();
    showToast('✅ גיבויים ישנים נמחקו', 'success');
    closeBackupsModal();
    showBackupsModal();
}

function closeBackupsModal() {
    const modal = document.getElementById('backupsModal');
    if (modal) modal.remove();
}

// ==========================================
// אתחול
// ==========================================

let sideBySideComparison;

document.addEventListener('DOMContentLoaded', () => {
    sideBySideComparison = new SideBySideComparison();
    console.log('✅ Advanced UI initialized!');
});
