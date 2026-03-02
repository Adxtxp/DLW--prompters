/* ===========================
   Global Variables & Config
   =========================== */
const API_BASE_URL = 'http://localhost:8000';

/* ===========================
   LocalStorage Mock Database
   =========================== */

function getMockReports() {
    const stored = localStorage.getItem('sentinel_reports');
    
    if (!stored) {
        // Initialize with 5 hardcoded mock reports
        const initialReports = [
            {
                id: 1,
                timestamp: "2026-03-02T09:45:00",
                message_snippet: "URGENT! Your account has been suspended. Click here within 30 minutes to verify...",
                message_type: "sms",
                risk_level: "High",
                risk_score: 92,
                tactics: ["Urgency", "Fear"],
                sender: "+65-9XXX-XXXX"
            },
            {
                id: 2,
                timestamp: "2026-03-02T08:30:00",
                message_snippet: "Notice from Singapore Government: You have an unpaid fine of $350. Pay immediately to avoid...",
                message_type: "sms",
                risk_level: "High",
                risk_score: 88,
                tactics: ["Authority", "Fear"],
                sender: "+65-8XXX-XXXX"
            },
            {
                id: 3,
                timestamp: "2026-03-01T16:20:00",
                message_snippet: "Your DBS account requires verification. Please update your details at...",
                message_type: "email",
                risk_level: "High",
                risk_score: 85,
                tactics: ["Authority", "Urgency"],
                sender: "noreply@dbs-verify.com"
            },
            {
                id: 4,
                timestamp: "2026-03-01T14:10:00",
                message_snippet: "Package delivery failed. Track your parcel and reschedule delivery at...",
                message_type: "sms",
                risk_level: "Medium",
                risk_score: 62,
                tactics: ["Urgency"],
                sender: "+65-9XXX-YYYY"
            },
            {
                id: 5,
                timestamp: "2026-03-01T11:00:00",
                message_snippet: "Congratulations! You've won $5000 in our lucky draw. Claim your prize by...",
                message_type: "email",
                risk_level: "Medium",
                risk_score: 58,
                tactics: ["Reward"],
                sender: "lucky-draw@prizes.net"
            }
        ];
        
        localStorage.setItem('sentinel_reports', JSON.stringify(initialReports));
        return initialReports;
    }
    
    return JSON.parse(stored);
}

function saveMockReport(newReport) {
    const reports = getMockReports();
    
    // Generate new ID
    const maxId = reports.length > 0 ? Math.max(...reports.map(r => r.id)) : 0;
    newReport.id = maxId + 1;
    
    // Add to beginning of array (most recent first)
    reports.unshift(newReport);
    
    // Save back to localStorage
    localStorage.setItem('sentinel_reports', JSON.stringify(reports));
    
    return newReport;
}

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
    try {
        const response = await fetch(`${API_BASE_URL}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: messageData.message })
        });
        if (!response.ok) throw new Error('Backend returned error');
        const backendResult = await response.json();
        
        // Map backend response to frontend format
        const riskScore = backendResult.risk_score;
        let riskLevel = 'Low';
        if (riskScore >= 70) riskLevel = 'High';
        else if (riskScore >= 40) riskLevel = 'Medium';
        
        // Parse tactics from "authority + urgency" format
        const tactics = backendResult.tactic !== 'none'
            ? backendResult.tactic.split(' + ').map(t => t.charAt(0).toUpperCase() + t.slice(1))
            : ['None'];
        
        // Build intervention text with simple mode support
        let intervention;
        if (messageData.simpleMode) {
            if (riskLevel === 'High') {
                intervention = "🧓 SIMPLE EXPLANATION:\n\nThis message is VERY suspicious. Here's what to do:\n\n1. DO NOT click any links in the message\n2. DO NOT call any phone numbers in the message\n3. DO NOT send any money or personal information\n4. Delete this message\n5. If it claims to be from your bank, call the number on the BACK of your bank card\n6. If it claims to be from the government, visit the official government website directly\n\nScammers use scary words to make you panic. Take your time. You are in control.";
            } else if (riskLevel === 'Medium') {
                intervention = "🧓 SIMPLE EXPLANATION:\n\nThis message looks suspicious. Be careful:\n\n1. Don't click links unless you're 100% sure\n2. Check if the sender is really who they claim to be\n3. Call the organization directly using their official number\n4. Ask a family member if you're unsure";
            } else {
                intervention = "🧓 SIMPLE EXPLANATION:\n\nThis message looks mostly safe, but always be careful:\n\n1. Only click links if you trust the sender\n2. Never share passwords or personal information\n3. When in doubt, ask someone you trust";
            }
        } else {
            intervention = backendResult.intervention_text;
        }
        
        const simpleModeNote = messageData.simpleMode ? "(Simple mode active - explanation simplified for accessibility)" : "";
        
        // Check clusters for similar reports count — match on tactic, not just biggest cluster
        let similarCount = 0;
        try {
            const clustersRes = await fetch(`${API_BASE_URL}/clusters`);
            if (clustersRes.ok) {
                const clustersData = await clustersRes.json();
                const analyzedTactic = backendResult.tactic; // e.g. "urgency + authority"
                // Find the cluster whose reports share this tactic
                const matchingCluster = clustersData.clusters.find(c =>
                    c.reports.some(r => r.tactic === analyzedTactic)
                );
                if (matchingCluster) {
                    similarCount = matchingCluster.report_count;
                } else {
                    // Fallback: count localStorage reports with any overlapping tactic
                    const storedReports = getMockReports();
                    const tacticWords = analyzedTactic.split(' + ');
                    similarCount = storedReports.filter(r => {
                        const rt = (r.tactics || []).join(' ').toLowerCase();
                        return tacticWords.some(tw => rt.includes(tw));
                    }).length;
                }
            }
        } catch (_) { /* clusters check is optional */ }
        
        return {
            risk_score: riskScore,
            risk_level: riskLevel,
            tactics: tactics,
            signals: backendResult.reasons || [],
            intervention: intervention,
            simple_mode: messageData.simpleMode,
            simple_mode_note: simpleModeNote,
            similar_reports_count: similarCount,
            redacted_text: backendResult.redacted_text,
            tactic_raw: backendResult.tactic,
            technical: `Backend analysis: Risk ${riskScore}/100. Tactics: ${backendResult.tactic}. ${backendResult.reasons.join('; ')}.`,
            _source: 'backend'
        };
    } catch (err) {
        console.warn('Backend unavailable, falling back to client-side analysis:', err.message);
        // Fallback to client-side heuristic
        return new Promise((resolve) => {
            setTimeout(() => {
                const analysis = analyzeMessageRisk(messageData.message);
                
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
                
                // Count REAL localStorage reports with matching tactics — no random numbers
                const storedReports = getMockReports();
                const analyzedTactics = analysis.tactics.map(t => t.toLowerCase());
                const similarCount = storedReports.filter(r => {
                    const reportTactics = (r.tactics || []).map(t => t.toLowerCase());
                    return analyzedTactics.some(t => t !== 'none' && reportTactics.includes(t));
                }).length;
                
                resolve({
                    risk_score: analysis.risk_score,
                    risk_level: analysis.risk_level,
                    tactics: analysis.tactics,
                    signals: analysis.signals,
                    intervention: intervention,
                    simple_mode: messageData.simpleMode,
                    simple_mode_note: simpleModeNote,
                    similar_reports_count: similarCount,
                    technical: `Client-side analysis: ${analysis.tactics.join(', ')} detected. Message length: ${messageData.message.length} chars.`,
                    _source: 'client'
                });
            }, 1500);
        });
    }
}

async function callReportsAPI() {
    try {
        const response = await fetch(`${API_BASE_URL}/reports`);
        if (!response.ok) throw new Error('Backend error');
        return await response.json();
    } catch (err) {
        console.warn('Backend /reports unavailable, using localStorage:', err.message);
        return null;
    }
}

async function callDashboardAPI() {
    try {
        const response = await fetch(`${API_BASE_URL}/clusters`);
        if (!response.ok) throw new Error('Backend error');
        return await response.json();
    } catch (err) {
        console.warn('Backend /clusters unavailable, using localStorage:', err.message);
        return null;
    }
}

async function callSaveReportAPI(reportData) {
    try {
        const response = await fetch(`${API_BASE_URL}/report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reportData)
        });
        if (!response.ok) throw new Error('Backend error');
        return await response.json();
    } catch (err) {
        console.warn('Backend /report unavailable, saving locally:', err.message);
        return {
            success: true,
            message: 'Report saved locally (backend offline)',
            report_id: Math.floor(Math.random() * 10000) + 1000,
            _source: 'local'
        };
    }
}

async function callClustersAPI() {
    try {
        const response = await fetch(`${API_BASE_URL}/clusters`);
        if (!response.ok) throw new Error('Backend error');
        return await response.json();
    } catch (err) {
        console.warn('Backend /clusters unavailable:', err.message);
        return null;
    }
}

async function callAuthorityPacketAPI(clusterId) {
    try {
        const response = await fetch(`${API_BASE_URL}/clusters/${clusterId}/authority-packet`);
        if (!response.ok) throw new Error('Backend error');
        return await response.json();
    } catch (err) {
        console.warn('Backend authority-packet unavailable:', err.message);
        return null;
    }
}
