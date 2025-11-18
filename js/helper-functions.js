// ===============================================
// Helper Functions - Global Utilities
// Version: 2.1.0
// ===============================================

// פונקציות עזר גלובליות שנקראות מכל מקום

// ==========================================
// VIEW & ADD FUNCTIONS
// ==========================================

function viewProduct(productId) {
    const product = store.getProducts().find(p => p.id === productId);
    if (!product) {
        showToast('❌ המוצר לא נמצא', 'error');
        return;
    }

    // עבור לדף השוואת מוצרים
    navigateToPage('compare');
    
    // הדגש את המוצר
    setTimeout(() => {
        const row = document.querySelector(`tr[data-product-id="${productId}"]`);
        if (row) {
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            row.classList.add('highlight');
            setTimeout(() => row.classList.remove('highlight'), 2000);
        }
    }, 300);
}

function addToCompare(productId) {
    // המוצר כבר בהשוואה, פשוט נווט אליו
    viewProduct(productId);
}

function addSearchResultsToCompare() {
    showToast('✅ כל התוצאות כבר בהשוואה', 'info');
    navigateToPage('compare');
}

// ==========================================
// NAVIGATION HELPER
// ==========================================
// navigateToPage מוגדרת ב-main.js - לא צריך כאן

// ==========================================
// RESET FILTERS
// ==========================================

function resetSearchFilters() {
    document.getElementById('searchQuery').value = '';
    document.getElementById('minPrice').value = '';
    document.getElementById('maxPrice').value = '';
    document.getElementById('minRating').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('sortBy').value = 'score-desc';
    
    document.querySelectorAll('.badge-filters input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });

    document.getElementById('searchResults').innerHTML = '';
    showToast('🔄 הסינונים אופסו', 'info');
}

// ==========================================
// LOAD SAVED SEARCH
// ==========================================

function loadSavedSearchFilter(searchId) {
    if (!searchId) return;

    const search = advancedSearch.loadSavedSearch(searchId);
    if (!search) return;

    // מלא את הטופס
    document.getElementById('searchQuery').value = search.query || '';
    document.getElementById('minPrice').value = search.filters.minPrice || '';
    document.getElementById('maxPrice').value = search.filters.maxPrice || '';
    document.getElementById('minRating').value = search.filters.minRating || '';
    document.getElementById('categoryFilter').value = search.filters.category || '';
    document.getElementById('sortBy').value = search.filters.sortBy || 'score-desc';

    // הרץ חיפוש
    executeAdvancedSearch();
}

// ==========================================
// EDIT NOTE
// ==========================================

function editNote(productId, noteId) {
    const notes = productNotes.getNotes(productId);
    const note = notes.find(n => n.id === noteId);
    
    if (!note) return;

    const newText = prompt('ערוך הערה:', note.text);
    if (!newText || newText.trim() === '') return;

    const newTags = prompt('תגיות (מופרד בפסיק):', note.tags.join(', '));
    const tags = newTags ? newTags.split(',').map(t => t.trim()) : [];

    productNotes.editNote(productId, noteId, newText.trim(), tags);
    showToast('✅ ההערה עודכנה!', 'success');
    
    closeNotesModal();
    showProductNotes(productId);
}

// ==========================================
// HIGHLIGHT CSS (להוספה ל-CSS)
// ==========================================

// הוסף סטייל להדגשה (אם עדיין לא קיים)
if (!document.getElementById('helper-styles')) {
    const style = document.createElement('style');
    style.id = 'helper-styles';
    style.textContent = `
        tr.highlight {
            animation: highlightPulse 2s ease-in-out;
        }

        @keyframes highlightPulse {
            0%, 100% {
                background: var(--bg-secondary);
            }
            50% {
                background: rgba(102, 126, 234, 0.2);
            }
        }
    `;
    document.head.appendChild(style);
}

console.log('✅ Helper Functions loaded!');
