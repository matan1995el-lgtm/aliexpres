// AliExpress Review Analyzer - Content Script

console.log('🚀 AliExpress Smart Tracker Extension Loaded!');

// Extract product information
function extractProductData() {
    const data = {
        name: '',
        price: '',
        rating: '',
        orders: '',
        reviews: {
            total: 0,
            positive: 0,
            withPhotos: 0,
            pros: [],
            cons: []
        }
    };
    
    // Extract product name
    const nameEl = document.querySelector('.product-title-text') || 
                   document.querySelector('h1[class*="title"]');
    if (nameEl) {
        data.name = nameEl.textContent.trim();
    }
    
    // Extract price
    const priceEl = document.querySelector('.product-price-value') ||
                    document.querySelector('[class*="price"]');
    if (priceEl) {
        const priceText = priceEl.textContent.trim();
        data.price = priceText.match(/[\d.]+/)?.[0] || '';
    }
    
    // Extract rating
    const ratingEl = document.querySelector('.overview-rating-average') ||
                     document.querySelector('[class*="rating"]');
    if (ratingEl) {
        const ratingText = ratingEl.textContent.trim();
        data.rating = ratingText.match(/[\d.]+/)?.[0] || '';
    }
    
    // Extract orders
    const ordersEl = document.querySelector('.product-reviewer-sold') ||
                     document.querySelector('[class*="sold"]');
    if (ordersEl) {
        const ordersText = ordersEl.textContent.trim();
        const match = ordersText.match(/[\d,]+/);
        if (match) {
            data.orders = match[0].replace(/,/g, '');
        }
    }
    
    return data;
}

// Analyze reviews
function analyzeReviews() {
    const reviews = {
        total: 0,
        positive: 0,
        withPhotos: 0,
        pros: [],
        cons: [],
        summary: ''
    };
    
    // Find review elements
    const reviewElements = document.querySelectorAll('[class*="feedback-item"]') ||
                          document.querySelectorAll('[class*="review"]');
    
    reviews.total = reviewElements.length;
    
    const keywords = {
        positive: ['good', 'great', 'excellent', 'perfect', 'amazing', 'love', 'recommend', 
                   'טוב', 'מעולה', 'נהדר', 'מושלם', 'ממליץ'],
        negative: ['bad', 'poor', 'terrible', 'worst', 'broken', 'fake', 'defect',
                   'רע', 'גרוע', 'שבור', 'פגום', 'לא טוב']
    };
    
    const prosCount = {};
    const consCount = {};
    
    reviewElements.forEach(review => {
        const text = review.textContent.toLowerCase();
        
        // Check if positive
        const isPositive = keywords.positive.some(kw => text.includes(kw));
        const isNegative = keywords.negative.some(kw => text.includes(kw));
        
        if (isPositive && !isNegative) {
            reviews.positive++;
        }
        
        // Check for photos
        const hasPhoto = review.querySelector('img') || 
                        review.querySelector('[class*="photo"]');
        if (hasPhoto) {
            reviews.withPhotos++;
        }
        
        // Extract common phrases
        if (isPositive) {
            keywords.positive.forEach(kw => {
                if (text.includes(kw)) {
                    prosCount[kw] = (prosCount[kw] || 0) + 1;
                }
            });
        }
        
        if (isNegative) {
            keywords.negative.forEach(kw => {
                if (text.includes(kw)) {
                    consCount[kw] = (consCount[kw] || 0) + 1;
                }
            });
        }
    });
    
    // Get top pros and cons
    reviews.pros = Object.entries(prosCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word, count]) => `${word} (${count})`);
    
    reviews.cons = Object.entries(consCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word, count]) => `${word} (${count})`);
    
    // Generate summary
    const positivePercent = reviews.total > 0 ? 
        Math.round((reviews.positive / reviews.total) * 100) : 0;
    
    reviews.summary = `${positivePercent}% ביקורות חיוביות מתוך ${reviews.total} ביקורות. `;
    reviews.summary += `${reviews.withPhotos} ביקורות עם תמונות.`;
    
    if (reviews.pros.length > 0) {
        reviews.summary += ` נקודות חיוביות: ${reviews.pros.join(', ')}.`;
    }
    
    if (reviews.cons.length > 0) {
        reviews.summary += ` בעיות נפוצות: ${reviews.cons.join(', ')}.`;
    }
    
    return reviews;
}

// Add button to page
function addAnalyzeButton() {
    // Check if button already exists
    if (document.getElementById('ali-tracker-btn')) return;
    
    const button = document.createElement('button');
    button.id = 'ali-tracker-btn';
    button.innerHTML = '📊 נתח ביקורות';
    button.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        padding: 12px 24px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 25px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transition: all 0.3s ease;
    `;
    
    button.addEventListener('mouseenter', () => {
        button.style.transform = 'scale(1.05)';
        button.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
    });
    
    button.addEventListener('mouseleave', () => {
        button.style.transform = 'scale(1)';
        button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    });
    
    button.addEventListener('click', () => {
        const productData = extractProductData();
        const reviewsData = analyzeReviews();
        
        const fullData = {
            ...productData,
            reviews: reviewsData
        };
        
        // Save to storage
        chrome.storage.local.set({ lastAnalysis: fullData }, () => {
            showNotification('✅ הניתוח הושלם! נתונים נשמרו.');
            
            // Copy to clipboard
            const text = formatForClipboard(fullData);
            navigator.clipboard.writeText(text).then(() => {
                console.log('📋 Data copied to clipboard');
            });
        });
    });
    
    document.body.appendChild(button);
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        background: white;
        color: #333;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        font-size: 14px;
        font-weight: 500;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Format data for clipboard
function formatForClipboard(data) {
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

סיכום: ${data.reviews.summary}
    `.trim();
}

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    @keyframes slideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
`;
document.head.appendChild(style);

// Initialize
if (window.location.href.includes('aliexpress.com/item')) {
    setTimeout(addAnalyzeButton, 2000); // Wait for page to load
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'analyze') {
        const productData = extractProductData();
        const reviewsData = analyzeReviews();
        sendResponse({ ...productData, reviews: reviewsData });
    }
});
