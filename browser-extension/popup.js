// Popup script for browser extension

document.getElementById('analyzeBtn').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url.includes('aliexpress.com')) {
        document.getElementById('status').textContent = '⚠️ זהו לא עמוד AliExpress!';
        return;
    }
    
    document.getElementById('status').textContent = '⏳ מנתח...';
    
    try {
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'analyze' });
        
        chrome.storage.local.set({ lastAnalysis: response }, () => {
            displayResults(response);
            document.getElementById('status').textContent = '✅ הניתוח הושלם!';
        });
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('status').textContent = '❌ שגיאה בניתוח';
    }
});

document.getElementById('copyBtn').addEventListener('click', () => {
    chrome.storage.local.get(['lastAnalysis'], (result) => {
        if (result.lastAnalysis) {
            const text = formatData(result.lastAnalysis);
            navigator.clipboard.writeText(text).then(() => {
                document.getElementById('status').textContent = '✅ הועתק ללוח!';
                setTimeout(() => {
                    document.getElementById('status').textContent = 'מוכן לניתוח';
                }, 2000);
            });
        } else {
            document.getElementById('status').textContent = '⚠️ אין נתונים להעתיק';
        }
    });
});

document.getElementById('openApp').addEventListener('click', () => {
    // Open the main app (you'll need to update this URL)
    chrome.tabs.create({ url: 'https://your-app-url.com' });
});

function displayResults(data) {
    const resultsDiv = document.getElementById('results');
    const dataDisplay = document.getElementById('dataDisplay');
    
    resultsDiv.innerHTML = `
        <p><strong>מוצר:</strong> ${data.name}</p>
        <p><strong>מחיר:</strong> $${data.price}</p>
        <p><strong>דירוג:</strong> ${data.rating} ⭐</p>
        <p><strong>הזמנות:</strong> ${data.orders}</p>
        <p><strong>ביקורות:</strong> ${data.reviews.total}</p>
        <p><strong>חיוביות:</strong> ${data.reviews.positive} (${Math.round((data.reviews.positive/data.reviews.total)*100)}%)</p>
        <p><strong>עם תמונות:</strong> ${data.reviews.withPhotos}</p>
    `;
    
    dataDisplay.style.display = 'block';
}

function formatData(data) {
    return `
מוצר: ${data.name}
מחיר: $${data.price}
דירוג: ${data.rating}
הזמנות: ${data.orders}

ביקורות:
- סה"כ: ${data.reviews.total}
- חיוביות: ${data.reviews.positive} (${Math.round((data.reviews.positive/data.reviews.total)*100)}%)
- עם תמונות: ${data.reviews.withPhotos}

נקודות חיוביות:
${data.reviews.pros.join('\n')}

בעיות נפוצות:
${data.reviews.cons.join('\n')}

${data.reviews.summary}
    `.trim();
}

// Load last analysis on popup open
chrome.storage.local.get(['lastAnalysis'], (result) => {
    if (result.lastAnalysis) {
        displayResults(result.lastAnalysis);
        document.getElementById('status').textContent = 'נתונים אחרונים טעונים';
    }
});
