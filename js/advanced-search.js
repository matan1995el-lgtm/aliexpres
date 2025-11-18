// ===== Advanced Global Search System =====
// חיפוש מתקדם עם סינון, שמירה והמלצות

class AdvancedSearch {
    constructor(dataStore) {
        this.store = dataStore;
        this.savedSearches = this.loadSavedSearches();
        this.searchHistory = this.loadSearchHistory();
    }

    // טעינת חיפושים שמורים
    loadSavedSearches() {
        try {
            const data = localStorage.getItem('savedSearches');
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error loading saved searches:', e);
            return [];
        }
    }

    // טעינת היסטוריית חיפושים
    loadSearchHistory() {
        try {
            const data = localStorage.getItem('searchHistory');
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error loading search history:', e);
            return [];
        }
    }

    // שמירת חיפושים
    saveSavedSearches() {
        localStorage.setItem('savedSearches', JSON.stringify(this.savedSearches));
    }

    saveSearchHistory() {
        // שמור רק 50 החיפושים האחרונים
        if (this.searchHistory.length > 50) {
            this.searchHistory = this.searchHistory.slice(0, 50);
        }
        localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
    }

    // חיפוש גלובלי - מחפש בכל הטבלאות
    globalSearch(query, options = {}) {
        const {
            searchIn = ['products', 'favorites', 'profiles'], // איפה לחפש
            caseSensitive = false,
            exactMatch = false,
            filters = {} // סינונים נוספים
        } = options;

        const searchQuery = caseSensitive ? query : query.toLowerCase();
        const results = {
            products: [],
            favorites: [],
            profiles: [],
            total: 0
        };

        // פונקציה לבדיקת התאמה
        const matchesQuery = (text) => {
            if (!text) return false;
            const searchText = caseSensitive ? text : text.toLowerCase();
            
            if (exactMatch) {
                return searchText === searchQuery;
            }
            return searchText.includes(searchQuery);
        };

        // חיפוש במוצרים
        if (searchIn.includes('products')) {
            results.products = this.store.getProducts().filter(product => {
                // חיפוש טקסט
                const textMatch = 
                    matchesQuery(product.name) ||
                    matchesQuery(product.notes) ||
                    matchesQuery(product.category) ||
                    matchesQuery(product.shippingCountry);

                // בדיקת פילטרים
                if (!this.applyFilters(product, filters)) return false;

                return textMatch;
            });
        }

        // חיפוש במועדפים
        if (searchIn.includes('favorites')) {
            results.favorites = this.store.getFavorites().filter(favorite => {
                const textMatch = 
                    matchesQuery(favorite.name) ||
                    matchesQuery(favorite.notes) ||
                    matchesQuery(favorite.tags?.join(' ')) ||
                    matchesQuery(favorite.category);

                if (!this.applyFilters(favorite, filters)) return false;

                return textMatch;
            });
        }

        // חיפוש בפרופילים
        if (searchIn.includes('profiles')) {
            results.profiles = this.store.getProfiles().filter(profile => {
                return matchesQuery(profile.name) ||
                       matchesQuery(profile.category) ||
                       matchesQuery(profile.notes);
            });
        }

        // סך הכל תוצאות
        results.total = results.products.length + results.favorites.length + results.profiles.length;

        // הוסף להיסטוריה
        this.addToHistory(query, results.total);

        return results;
    }

    // החלת פילטרים
    applyFilters(item, filters) {
        // פילטר טווח מחירים
        if (filters.minPrice !== undefined && item.price < filters.minPrice) return false;
        if (filters.maxPrice !== undefined && item.price > filters.maxPrice) return false;

        // פילטר דירוג
        if (filters.minRating !== undefined && item.rating < filters.minRating) return false;

        // פילטר קטגוריה
        if (filters.category && item.category !== filters.category) return false;

        // פילטר תגיות (למועדפים)
        if (filters.tags && filters.tags.length > 0) {
            if (!item.tags || !filters.tags.some(tag => item.tags.includes(tag))) {
                return false;
            }
        }

        // פילטר משלוח חינם
        if (filters.freeShipping === true && item.shipping > 0) return false;

        // פילטר זמן משלוח
        if (filters.maxDelivery !== undefined && item.deliveryDays > filters.maxDelivery) return false;

        // פילטר מדינת שילוח
        if (filters.shippingCountry && item.shippingCountry !== filters.shippingCountry) return false;

        // פילטר לפי ציון מומלץ
        if (filters.minScore !== undefined && item.score < filters.minScore) return false;

        return true;
    }

    // חיפוש מתקדם עם משקלים (relevance score)
    advancedSearch(query, options = {}) {
        const results = this.globalSearch(query, options);
        
        // חשב relevance score לכל תוצאה
        const scoredResults = {
            products: this.scoreResults(results.products, query, 'product'),
            favorites: this.scoreResults(results.favorites, query, 'favorite'),
            profiles: this.scoreResults(results.profiles, query, 'profile'),
            total: results.total
        };

        // מיין לפי relevance
        scoredResults.products.sort((a, b) => b.relevance - a.relevance);
        scoredResults.favorites.sort((a, b) => b.relevance - a.relevance);
        scoredResults.profiles.sort((a, b) => b.relevance - a.relevance);

        return scoredResults;
    }

    // חישוב ציון relevance
    scoreResults(items, query, type) {
        const queryLower = query.toLowerCase();
        
        return items.map(item => {
            let score = 0;

            // משקל גבוה: התאמה בשם
            if (item.name?.toLowerCase().includes(queryLower)) {
                score += item.name.toLowerCase() === queryLower ? 100 : 50;
            }

            // משקל בינוני: התאמה בקטגוריה
            if (item.category?.toLowerCase().includes(queryLower)) {
                score += 30;
            }

            // משקל נמוך: התאמה בהערות
            if (item.notes?.toLowerCase().includes(queryLower)) {
                score += 10;
            }

            // משקל נוסף: התאמה בתגיות (מועדפים)
            if (item.tags?.some(tag => tag.toLowerCase().includes(queryLower))) {
                score += 20;
            }

            // בונוס: מוצרים עם ציון גבוה
            if (type === 'product' && item.score) {
                score += item.score * 0.1;
            }

            // בונוס: מועדפים עם עדיפות גבוהה
            if (type === 'favorite' && item.priority === 'high') {
                score += 15;
            }

            return {
                ...item,
                relevance: score
            };
        });
    }

    // שמירת חיפוש
    saveSearch(name, query, filters = {}) {
        const search = {
            id: Date.now().toString(),
            name: name,
            query: query,
            filters: filters,
            createdAt: new Date().toISOString(),
            usageCount: 0
        };

        this.savedSearches.push(search);
        this.saveSavedSearches();

        return search;
    }

    // מחיקת חיפוש שמור
    deleteSavedSearch(id) {
        this.savedSearches = this.savedSearches.filter(s => s.id !== id);
        this.saveSavedSearches();
    }

    // שימוש בחיפוש שמור
    useSavedSearch(id) {
        const search = this.savedSearches.find(s => s.id === id);
        if (!search) return null;

        // עדכן מונה שימוש
        search.usageCount = (search.usageCount || 0) + 1;
        search.lastUsed = new Date().toISOString();
        this.saveSavedSearches();

        // הפעל את החיפוש
        return this.advancedSearch(search.query, { filters: search.filters });
    }

    // הוספה להיסטוריה
    addToHistory(query, resultsCount) {
        // אל תוסיף חיפושים ריקים
        if (!query.trim()) return;

        // בדוק אם כבר קיים
        const existingIndex = this.searchHistory.findIndex(h => h.query === query);
        
        if (existingIndex !== -1) {
            // עדכן קיים
            this.searchHistory[existingIndex].count++;
            this.searchHistory[existingIndex].lastSearched = new Date().toISOString();
            // העבר לראש הרשימה
            const item = this.searchHistory.splice(existingIndex, 1)[0];
            this.searchHistory.unshift(item);
        } else {
            // הוסף חדש
            this.searchHistory.unshift({
                query: query,
                count: 1,
                resultsCount: resultsCount,
                lastSearched: new Date().toISOString()
            });
        }

        this.saveSearchHistory();
    }

    // ניקוי היסטוריה
    clearHistory() {
        this.searchHistory = [];
        this.saveSearchHistory();
    }

    // חיפושים פופולריים
    getPopularSearches(limit = 10) {
        return [...this.searchHistory]
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }

    // חיפושים אחרונים
    getRecentSearches(limit = 10) {
        return this.searchHistory.slice(0, limit);
    }

    // המלצות חיפוש (autocomplete)
    getSuggestions(partialQuery, limit = 5) {
        if (!partialQuery || partialQuery.length < 2) return [];

        const queryLower = partialQuery.toLowerCase();
        const suggestions = new Set();

        // מהיסטוריה
        this.searchHistory.forEach(item => {
            if (item.query.toLowerCase().includes(queryLower)) {
                suggestions.add(item.query);
            }
        });

        // משמות מוצרים
        this.store.getProducts().forEach(product => {
            if (product.name.toLowerCase().includes(queryLower)) {
                suggestions.add(product.name);
            }
        });

        // מקטגוריות
        const categories = [...new Set([
            ...this.store.getProducts().map(p => p.category).filter(Boolean),
            ...this.store.getFavorites().map(f => f.category).filter(Boolean)
        ])];
        
        categories.forEach(category => {
            if (category.toLowerCase().includes(queryLower)) {
                suggestions.add(category);
            }
        });

        // מתגיות
        this.store.getFavorites().forEach(favorite => {
            if (favorite.tags) {
                favorite.tags.forEach(tag => {
                    if (tag.toLowerCase().includes(queryLower)) {
                        suggestions.add(tag);
                    }
                });
            }
        });

        return Array.from(suggestions).slice(0, limit);
    }

    // חיפוש דומה (fuzzy search)
    fuzzySearch(query, threshold = 0.6) {
        const results = {
            products: [],
            favorites: [],
            profiles: []
        };

        // פונקציה לחישוב דמיון (Levenshtein distance מפושט)
        const similarity = (str1, str2) => {
            const longer = str1.length > str2.length ? str1 : str2;
            const shorter = str1.length > str2.length ? str2 : str1;
            
            if (longer.length === 0) return 1.0;
            
            const editDistance = this.levenshteinDistance(longer, shorter);
            return (longer.length - editDistance) / longer.length;
        };

        const queryLower = query.toLowerCase();

        // חפש במוצרים
        this.store.getProducts().forEach(product => {
            const sim = similarity(queryLower, product.name.toLowerCase());
            if (sim >= threshold) {
                results.products.push({ ...product, similarity: sim });
            }
        });

        // חפש במועדפים
        this.store.getFavorites().forEach(favorite => {
            const sim = similarity(queryLower, favorite.name.toLowerCase());
            if (sim >= threshold) {
                results.favorites.push({ ...favorite, similarity: sim });
            }
        });

        // מיין לפי דמיון
        results.products.sort((a, b) => b.similarity - a.similarity);
        results.favorites.sort((a, b) => b.similarity - a.similarity);

        return results;
    }

    // Levenshtein Distance
    levenshteinDistance(str1, str2) {
        const matrix = [];

        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[str2.length][str1.length];
    }

    // סטטיסטיקות חיפוש
    getSearchStats() {
        return {
            totalSearches: this.searchHistory.reduce((sum, item) => sum + item.count, 0),
            uniqueSearches: this.searchHistory.length,
            savedSearches: this.savedSearches.length,
            popularSearches: this.getPopularSearches(5),
            recentSearches: this.getRecentSearches(5)
        };
    }
}

// ייצוא
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedSearch;
}
