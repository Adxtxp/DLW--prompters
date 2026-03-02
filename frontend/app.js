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
   Client-Side Risk Analysis (Heuristic)
   =========================== */

function analyzeMessageRisk(message) {
    const text = message.toLowerCase();
    let riskScore = 0;
    const detectedTactics = [];
    const detectedSignals = [];
    
    // Urgency indicators (30 points max)
    const urgencyKeywords = ['urgent', 'immediately', 'now', 'expires', 'limited time', 'within', 'minutes', 'hours', 'act now', 'hurry', 'quick'];
    const urgencyCount = urgencyKeywords.filter(kw => text.includes(kw)).length;
    if (urgencyCount > 0) {
        riskScore += Math.min(urgencyCount * 10, 30);
        detectedTactics.push('Urgency');
        detectedSignals.push('Requests immediate action');
    }
    
    // Authority indicators (30 points max)
    const authorityKeywords = ['government', 'police', 'bank', 'official', 'authority', 'department', 'ministry', 'irs', 'tax', 'legal', 'court', 'suspended', 'verify', 'confirm your', 'account'];
    const authorityCount = authorityKeywords.filter(kw => text.includes(kw)).length;
    if (authorityCount > 0) {
        riskScore += Math.min(authorityCount * 8, 30);
        detectedTactics.push('Authority');
        detectedSignals.push('Claims to be from official organization');
    }
    
    // Fear indicators (25 points max)
    const fearKeywords = ['suspend', 'blocked', 'legal action', 'arrest', 'fine', 'penalty', 'terminated', 'closed', 'fraud', 'unauthorized', 'security breach', 'compromised'];
    const fearCount = fearKeywords.filter(kw => text.includes(kw)).length;
    if (fearCount > 0) {
        riskScore += Math.min(fearCount * 10, 25);
        detectedTactics.push('Fear');
        detectedSignals.push('Uses threatening language');
    }
    
    // Reward indicators (20 points max)
    const rewardKeywords = ['won', 'prize', 'claim', 'congratulations', 'winner', 'selected', 'free', 'gift', '$', 'reward', 'cash'];
    const rewardCount = rewardKeywords.filter(kw => text.includes(kw)).length;
    if (rewardCount > 0) {
        riskScore += Math.min(rewardCount * 8, 20);
        detectedTactics.push('Reward');
        detectedSignals.push('Promises unexpected rewards');
    }
    
    // Suspicious patterns
    if (text.includes('click') || text.includes('link') || text.match(/https?:\/\//)) {
        riskScore += 15;
        detectedSignals.push('Suspicious link');
    }
    
    if (text.match(/\+?\d{2,3}[-.\s]?\d{3,4}[-.\s]?\d{4}/)) {
        riskScore += 10;
        detectedSignals.push('Contains phone number');
    }
    
    if (text.includes('password') || text.includes('pin') || text.includes('credit card')) {
        riskScore += 20;
        detectedSignals.push('Requests sensitive information');
    }
    
    // Cap at 100
    riskScore = Math.min(riskScore, 100);
    
    // Determine risk level
    let riskLevel = 'Low';
    if (riskScore >= 70) riskLevel = 'High';
    else if (riskScore >= 40) riskLevel = 'Medium';
    
    // Remove duplicate tactics
    const uniqueTactics = [...new Set(detectedTactics)];
    
    // Add default signal if none detected
    if (detectedSignals.length === 0) {
        detectedSignals.push('No major warning signs detected');
    }
    
    return {
        risk_score: riskScore,
        risk_level: riskLevel,
        tactics: uniqueTactics.length > 0 ? uniqueTactics : ['None'],
        signals: detectedSignals
    };
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
            // Dynamic risk analysis based on message content
            const analysis = analyzeMessageRisk(messageData.message);
            
            // Generate intervention text based on risk level and simple mode
            let intervention;
            if (messageData.simpleMode) {
                if (analysis.risk_level === 'High') {
                    intervention = "🧓 SIMPLE EXPLANATION:\n\nThis message is VERY suspicious. Here's what to do:\n\n1. DO NOT click any links in the message\n2. DO NOT call any phone numbers in the message\n3. DO NOT send any money or personal information\n4. Delete this message\n5. If it claims to be from your bank, call the number on the BACK of your bank card\n6. If it claims to be from the government, visit the official government website directly\n\nScammers use scary words to make you panic. Take your time. You are in control.";
                } else if (analysis.risk_level === 'Medium') {
                    intervention = "🧓 SIMPLE EXPLANATION:\n\nThis message looks suspicious. Be careful:\n\n1. Don't click links unless you're 100% sure\n2. Check if the sender is really who they claim to be\n3. Call the organization directly using their official number\n4. Ask a family member if you're unsure";
                } else {
                    intervention = "🧓 SIMPLE EXPLANATION:\n\nThis message looks mostly safe, but always be careful:\n\n1. Only click links if you trust the sender\n2. Never share passwords or personal information\n3. When in doubt, ask someone you trust";
                }
            } else {
                if (analysis.risk_level === 'High') {
                    intervention = "⚠️ CRITICAL WARNING:\n\nStop. Do not interact with this message. This exhibits multiple social engineering attack patterns designed to exploit psychological vulnerabilities. Verify through official channels only.";
                } else if (analysis.risk_level === 'Medium') {
                    intervention = "⚠️ CAUTION ADVISED:\n\nThis message shows suspicious characteristics. Exercise caution. Verify sender authenticity through independent channels before taking any action.";
                } else {
                    intervention = "ℹ️ LOW RISK:\n\nNo major phishing indicators detected. However, always verify unexpected requests and avoid sharing sensitive information.";
                }
            }
            
            const simpleModeNote = messageData.simpleMode ? "(Simple mode active - explanation simplified for accessibility)" : "";
            
            // Determine similar reports count based on risk (higher risk = more reports)
            let similarCount = 0;
            if (analysis.risk_level === 'High') {
                similarCount = Math.floor(Math.random() * 8) + 8; // 8-15 reports
            } else if (analysis.risk_level === 'Medium') {
                similarCount = Math.floor(Math.random() * 3) + 2; // 2-4 reports
            }
            
            resolve({
                risk_score: analysis.risk_score,
                risk_level: analysis.risk_level,
                tactics: analysis.tactics,
                signals: analysis.signals,
                intervention: intervention,
                simple_mode: messageData.simpleMode,
                simple_mode_note: simpleModeNote,
                similar_reports_count: similarCount,
                technical: `Message length: ${messageData.message.length} chars. Pattern analysis: ${analysis.tactics.join(', ')} detected.`
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
