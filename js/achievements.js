// ===== Achievements System =====

class AchievementsSystem {
    constructor() {
        this.achievements = {
            first_profile: {
                id: 'first_profile',
                name: 'פרופיל ראשון',
                description: 'צור את פרופיל החיפוש הראשון שלך',
                icon: '🎯',
                points: 10,
                unlocked: false
            },
            profile_master: {
                id: 'profile_master',
                name: 'מומחה פרופילים',
                description: 'צור 5 פרופילי חיפוש שונים',
                icon: '🎓',
                points: 50,
                unlocked: false,
                progress: 0,
                target: 5
            },
            first_product: {
                id: 'first_product',
                name: 'מוצר ראשון',
                description: 'הוסף את המוצר הראשון להשוואה',
                icon: '📦',
                points: 10,
                unlocked: false
            },
            comparison_expert: {
                id: 'comparison_expert',
                name: 'מומחה השוואות',
                description: 'השווה 50 מוצרים',
                icon: '⚖️',
                points: 100,
                unlocked: false,
                progress: 0,
                target: 50
            },
            first_favorite: {
                id: 'first_favorite',
                name: 'מועדף ראשון',
                description: 'הוסף מוצר למועדפים',
                icon: '⭐',
                points: 10,
                unlocked: false
            },
            deal_hunter: {
                id: 'deal_hunter',
                name: 'צייד מבצעים',
                description: 'חסוך 100$ בסך הכל',
                icon: '💰',
                points: 150,
                unlocked: false,
                progress: 0,
                target: 100
            },
            smart_shopper: {
                id: 'smart_shopper',
                name: 'קונה חכם',
                description: 'קנה מוצר עם ציון מומלץ מעל 90',
                icon: '🧠',
                points: 75,
                unlocked: false
            },
            night_owl: {
                id: 'night_owl',
                name: 'עובד לילה',
                description: 'השתמש במצב כהה 20 פעמים',
                icon: '🌙',
                points: 25,
                unlocked: false,
                progress: 0,
                target: 20
            },
            data_master: {
                id: 'data_master',
                name: 'אנליסט מקצועי',
                description: 'ייצא 10 קבצי אקסל',
                icon: '📊',
                points: 50,
                unlocked: false,
                progress: 0,
                target: 10
            },
            scanner_pro: {
                id: 'scanner_pro',
                name: 'מומחה סריקה',
                description: 'סרוק 10 QR codes',
                icon: '📸',
                points: 40,
                unlocked: false,
                progress: 0,
                target: 10
            },
            social_butterfly: {
                id: 'social_butterfly',
                name: 'פרפר חברתי',
                description: 'שתף 5 מוצרים עם חברים',
                icon: '🦋',
                points: 30,
                unlocked: false,
                progress: 0,
                target: 5
            },
            perfectionist: {
                id: 'perfectionist',
                name: 'פרפקציוניסט',
                description: 'מלא את כל השדות במוצר כולל מפרטים וביקורות',
                icon: '💎',
                points: 60,
                unlocked: false
            },
            early_bird: {
                id: 'early_bird',
                name: 'ציפור מוקדמת',
                description: 'השתמש במערכת 7 ימים ברציפות',
                icon: '🐦',
                points: 80,
                unlocked: false,
                progress: 0,
                target: 7
            },
            collector: {
                id: 'collector',
                name: 'אספן',
                description: 'שמור 20 מוצרים במועדפים',
                icon: '🎁',
                points: 70,
                unlocked: false,
                progress: 0,
                target: 20
            },
            legend: {
                id: 'legend',
                name: 'אגדה',
                description: 'הגע ל-1000 נקודות',
                icon: '🏆',
                points: 500,
                unlocked: false
            }
        };
        
        this.loadAchievements();
    }

    loadAchievements() {
        const saved = localStorage.getItem('achievements');
        if (saved) {
            const savedData = JSON.parse(saved);
            // Merge saved data with default achievements
            Object.keys(this.achievements).forEach(key => {
                if (savedData[key]) {
                    this.achievements[key] = { ...this.achievements[key], ...savedData[key] };
                }
            });
        }
    }

    saveAchievements() {
        localStorage.setItem('achievements', JSON.stringify(this.achievements));
    }

    getTotalPoints() {
        return Object.values(this.achievements).reduce((sum, achievement) => {
            return sum + (achievement.unlocked ? achievement.points : 0);
        }, 0);
    }

    getLevel() {
        const points = this.getTotalPoints();
        
        if (points >= 1000) return { level: 10, name: 'אגדה' };
        if (points >= 750) return { level: 9, name: 'מאסטר' };
        if (points >= 500) return { level: 8, name: 'מומחה' };
        if (points >= 350) return { level: 7, name: 'מתקדם מאוד' };
        if (points >= 250) return { level: 6, name: 'מתקדם' };
        if (points >= 150) return { level: 5, name: 'ביניים גבוה' };
        if (points >= 100) return { level: 4, name: 'ביניים' };
        if (points >= 50) return { level: 3, name: 'מתחיל מתקדם' };
        if (points >= 20) return { level: 2, name: 'טירון' };
        return { level: 1, name: 'מתחיל' };
    }

    getLevelProgress() {
        const points = this.getTotalPoints();
        const levels = [0, 20, 50, 100, 150, 250, 350, 500, 750, 1000];
        const currentLevel = this.getLevel().level;
        
        if (currentLevel >= 10) return { progress: 100, current: points, next: 1000 };
        
        const currentLevelMin = levels[currentLevel - 1];
        const nextLevelMin = levels[currentLevel];
        
        const progress = ((points - currentLevelMin) / (nextLevelMin - currentLevelMin)) * 100;
        
        return {
            progress: Math.round(progress),
            current: points,
            next: nextLevelMin
        };
    }

    checkAchievement(achievementId, customProgress = null) {
        const achievement = this.achievements[achievementId];
        
        if (!achievement || achievement.unlocked) return false;
        
        let shouldUnlock = false;
        
        if (achievement.target !== undefined) {
            // Progressive achievement
            if (customProgress !== null) {
                achievement.progress = customProgress;
            } else {
                achievement.progress = (achievement.progress || 0) + 1;
            }
            
            if (achievement.progress >= achievement.target) {
                shouldUnlock = true;
            }
        } else {
            // One-time achievement
            shouldUnlock = true;
        }
        
        if (shouldUnlock) {
            achievement.unlocked = true;
            achievement.unlockedAt = new Date().toISOString();
            this.saveAchievements();
            this.showAchievementPopup(achievement);
            return true;
        }
        
        this.saveAchievements();
        return false;
    }

    showAchievementPopup(achievement) {
        const popup = document.getElementById('achievementUnlock');
        
        popup.querySelector('.achievement-icon').textContent = achievement.icon;
        popup.querySelector('.achievement-title').textContent = achievement.name;
        popup.querySelector('.achievement-description').textContent = achievement.description;
        popup.querySelector('.achievement-points span').textContent = achievement.points;
        
        popup.classList.add('show');
        
        // Play sound if available
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZRQ0PVqzn77BdGws+ltryxnMnBSl+zPLaizsIGGS37OihUBELTKXh8bllHAU2jdXzzn0vBSF1xe/glEILElqy6+2nVxQL');
        audio.volume = 0.3;
        audio.play().catch(() => {});
        
        setTimeout(() => {
            popup.classList.remove('show');
        }, 4000);
        
        showToast(`🏆 הישג חדש: ${achievement.name}!`, 'success');
    }

    renderAchievementsPage() {
        const grid = document.getElementById('achievementsGrid');
        if (!grid) return;
        
        const totalPoints = this.getTotalPoints();
        const level = this.getLevel();
        const progress = this.getLevelProgress();
        
        // Update level info
        document.getElementById('totalPoints').textContent = totalPoints;
        document.getElementById('currentLevel').textContent = level.level;
        document.getElementById('levelName').textContent = level.name;
        document.getElementById('levelProgress').style.width = `${progress.progress}%`;
        document.getElementById('levelPointsNow').textContent = progress.current;
        document.getElementById('levelPointsNext').textContent = progress.next;
        
        // Render achievements
        grid.innerHTML = Object.values(this.achievements).map(achievement => {
            const progressBar = achievement.target ? 
                `<div class="achievement-progress">
                    <div class="achievement-progress-fill" style="width: ${(achievement.progress || 0) / achievement.target * 100}%"></div>
                </div>
                <small>${achievement.progress || 0} / ${achievement.target}</small>` : '';
            
            return `
                <div class="achievement-card ${achievement.unlocked ? '' : 'locked'}">
                    <div class="achievement-icon-large">${achievement.icon}</div>
                    <h4>${achievement.name}</h4>
                    <p>${achievement.description}</p>
                    ${progressBar}
                    <span class="achievement-points-badge">${achievement.points} נקודות</span>
                    ${achievement.unlocked ? '<div style="margin-top:8px;color:var(--success-color);font-weight:600;">✓ הושג!</div>' : ''}
                </div>
            `;
        }).join('');
    }
}

// Initialize achievements system
const achievementsSystem = new AchievementsSystem();

// Track achievements automatically
function trackAchievement(action, value = null) {
    const profilesCount = store.getProfiles().length;
    const productsCount = store.getProducts().length;
    const favoritesCount = store.getFavorites().length;
    
    switch(action) {
        case 'profile_created':
            if (profilesCount === 1) {
                achievementsSystem.checkAchievement('first_profile');
            }
            achievementsSystem.checkAchievement('profile_master', profilesCount);
            break;
            
        case 'product_added':
            if (productsCount === 1) {
                achievementsSystem.checkAchievement('first_product');
            }
            achievementsSystem.checkAchievement('comparison_expert', productsCount);
            break;
            
        case 'favorite_added':
            if (favoritesCount === 1) {
                achievementsSystem.checkAchievement('first_favorite');
            }
            achievementsSystem.checkAchievement('collector', favoritesCount);
            break;
            
        case 'savings':
            achievementsSystem.checkAchievement('deal_hunter', value);
            break;
            
        case 'high_score_product':
            achievementsSystem.checkAchievement('smart_shopper');
            break;
            
        case 'dark_mode':
            const darkModeCount = parseInt(localStorage.getItem('darkModeCount') || '0') + 1;
            localStorage.setItem('darkModeCount', darkModeCount);
            achievementsSystem.checkAchievement('night_owl', darkModeCount);
            break;
            
        case 'excel_export':
            const excelCount = parseInt(localStorage.getItem('excelExports') || '0') + 1;
            localStorage.setItem('excelExports', excelCount);
            achievementsSystem.checkAchievement('data_master', excelCount);
            break;
            
        case 'qr_scan':
            const qrCount = parseInt(localStorage.getItem('qrScans') || '0') + 1;
            localStorage.setItem('qrScans', qrCount);
            achievementsSystem.checkAchievement('scanner_pro', qrCount);
            break;
            
        case 'share':
            const shareCount = parseInt(localStorage.getItem('shares') || '0') + 1;
            localStorage.setItem('shares', shareCount);
            achievementsSystem.checkAchievement('social_butterfly', shareCount);
            break;
            
        case 'complete_product':
            achievementsSystem.checkAchievement('perfectionist');
            break;
            
        case 'daily_visit':
            const lastVisit = localStorage.getItem('lastVisit');
            const today = new Date().toDateString();
            
            if (lastVisit !== today) {
                const streak = parseInt(localStorage.getItem('visitStreak') || '0');
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                
                if (lastVisit === yesterday.toDateString()) {
                    const newStreak = streak + 1;
                    localStorage.setItem('visitStreak', newStreak);
                    achievementsSystem.checkAchievement('early_bird', newStreak);
                } else {
                    localStorage.setItem('visitStreak', '1');
                }
                
                localStorage.setItem('lastVisit', today);
            }
            break;
            
        case 'legend':
            if (achievementsSystem.getTotalPoints() >= 1000) {
                achievementsSystem.checkAchievement('legend');
            }
            break;
    }
}

// Check daily visit on load
trackAchievement('daily_visit');
