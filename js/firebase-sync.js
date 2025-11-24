// js/firebase-sync.js
class FirebaseSync {
    constructor() {
        this.isEnabled = false;
        this.user = null;
        this.db = null;
        this.init();
    }

    init() {
        // Check if Firebase is available
        if (typeof firebase === 'undefined') {
            console.warn('⚠️ Firebase not loaded');
            return;
        }

        try {
            // Initialize Firebase
            firebase.initializeApp(firebaseConfig);
            this.db = firebase.firestore();
            this.setupAuth();
        } catch (error) {
            console.warn('⚠️ Firebase init failed:', error);
        }
    }

    async setupAuth() {
        try {
            // Anonymous authentication
            await firebase.auth().signInAnonymously();
            this.user = firebase.auth().currentUser;
            this.isEnabled = true;
            console.log('✅ Firebase connected anonymously');
            
            // Start syncing
            this.startSync();
        } catch (error) {
            console.warn('⚠️ Firebase auth failed:', error);
            this.isEnabled = false;
        }
    }

    startSync() {
        // Sync every 30 seconds
        setInterval(() => {
            if (this.isEnabled && this.user) {
                this.syncAllData();
            }
        }, 30000);

        // Listen for real-time updates
        this.setupRealTimeSync();
    }

    async syncAllData() {
        if (!this.isEnabled) return;

        try {
            const allData = window.DataStore ? window.DataStore.getAllData() : this.getAllDataFromStorage();
            await this.db.collection('users').doc(this.user.uid).set({
                ...allData,
                lastSync: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            console.log('✅ Data synced to Firebase');
            this.updateSyncStatus('connected', 'מסונכרן');
        } catch (error) {
            console.warn('⚠️ Sync failed:', error);
            this.updateSyncStatus('disconnected', 'שגיאה בסנכרון');
        }
    }

    getAllDataFromStorage() {
        // Fallback if DataStore not available
        return {
            profiles: JSON.parse(localStorage.getItem('profiles') || '[]'),
            products: JSON.parse(localStorage.getItem('products') || '[]'),
            favorites: JSON.parse(localStorage.getItem('favorites') || '[]'),
            settings: JSON.parse(localStorage.getItem('settings') || '{}'),
            lastSync: Date.now()
        };
    }

    setupRealTimeSync() {
        if (this.user) {
            this.db.collection('users').doc(this.user.uid)
                .onSnapshot((doc) => {
                    if (doc.exists) {
                        const remoteData = doc.data();
                        this.handleRemoteUpdate(remoteData);
                    }
                });
        }
    }

    handleRemoteUpdate(remoteData) {
        const localData = window.DataStore ? window.DataStore.getAllData() : this.getAllDataFromStorage();
        const remoteTime = remoteData.lastSync?.toDate().getTime() || 0;
        const localTime = localData.lastSync || 0;

        if (remoteTime > localTime) {
            console.log('🔄 Loading newer data from Firebase');
            this.importData(remoteData);
            this.showNotification('נתונים עודכנו מהענן', 'success');
        }
    }

    importData(data) {
        // Save to localStorage
        Object.keys(data).forEach(key => {
            if (key !== 'lastSync') {
                localStorage.setItem(key, JSON.stringify(data[key]));
            }
        });
        
        // Update UI if DataStore exists
        if (window.DataStore && window.DataStore.updateUI) {
            window.DataStore.updateUI();
        }
    }

    updateSyncStatus(status, message) {
        const statusElement = document.getElementById('syncStatus');
        if (statusElement) {
            statusElement.className = `sync-status ${status}`;
            statusElement.innerHTML = `<i class="fas fa-${status === 'connected' ? 'cloud' : 'cloud-slash'}"></i><span>${message}</span>`;
        }
    }

    showNotification(message, type) {
        // Use existing toast system
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            console.log('📢', message);
        }
    }
}

// Global functions for manual sync
window.forceSync = function() {
    if (window.firebaseSync && window.firebaseSync.isEnabled) {
        window.firebaseSync.syncAllData();
        window.firebaseSync.showNotification('מסתנכרן עם הענן...', 'info');
    }
};

window.loadFromCloud = async function() {
    if (window.firebaseSync && window.firebaseSync.isEnabled) {
        const cloudData = await window.firebaseSync.db.collection('users').doc(window.firebaseSync.user.uid).get();
        if (cloudData.exists) {
            if (confirm('להחליף את הנתונים המקומיים עם נתונים מהענן?')) {
                window.firebaseSync.importData(cloudData.data());
                window.firebaseSync.showNotification('נתונים נטענו מהענן', 'success');
            }
        }
    }
};

// Initialize when ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.firebaseSync = new FirebaseSync();
    }, 1000);
});