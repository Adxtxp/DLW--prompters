/* ===========================
   Global Variables & Config
   =========================== */
const API_BASE_URL = 'http://localhost:8000/api';

/* ===========================
   Utility Functions
   =========================== */

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    };
    return date.toLocaleDateString('en-US', options);
}

function getRiskColor(riskLevel) {
    const level = riskLevel.toLowerCase();
    if (level === 'high') return '#dc3545';
    if (level === 'medium') return '#fd7e14';
    if (level === 'low') return '#28a745';
    return '#6c757d';
}

function getRiskBadgeClass(riskLevel) {
    const level = riskLevel.toLowerCase();
    if (level === 'high') return 'risk-high';
    if (level === 'medium') return 'risk-medium';
    if (level === 'low') return 'risk-low';
    return 'risk-unknown';
}

/* ===========================
   API Call Functions (Ready for Backend)
   =========================== */

async function callAnalyzeAPI(messageData) {
    // Uncomment when backend is ready:
    // const response = await fetch(`${API_BASE_URL}/analyze`, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(messageData)
    // });
    // return await response.json();
    
    // For now, return mock data
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                risk_score: 88,
                risk_level: "High",
                tactics: ["Authority", "Urgency"],
                signals: ["Requests immediate action", "Suspicious link", "Claims to be from government"],
                intervention: "Stop. Do not click any links. Government agencies do not demand payment via SMS. Verify through official hotline.",
                technical: "No SPF/DKIM detected. Suspicious domain pattern."
            });
        }, 1500);
    });
}

async function callReportsAPI() {
    // Uncomment when backend is ready:
    // const response = await fetch(`${API_BASE_URL}/reports`);
    // return await response.json();
    
    // For now, return empty (will use mock data)
    return null;
}

async function callDashboardAPI() {
    // Uncomment when backend is ready:
    // const response = await fetch(`${API_BASE_URL}/dashboard`);
    // return await response.json();
    
    // For now, return empty (will use mock data)
    return null;
}
