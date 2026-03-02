/* ===========================
   Analyze Page Logic
   =========================== */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('analyzeForm');
    
    if (form) {
        form.addEventListener('submit', handleAnalyzeSubmit);
    }
});

async function handleAnalyzeSubmit(event) {
    event.preventDefault();
    
    // Get form elements
    const analyzeBtn = document.getElementById('analyzeBtn');
    const btnText = document.getElementById('btnText');
    const btnLoader = document.getElementById('btnLoader');
    const resultsSection = document.getElementById('resultsSection');
    const errorSection = document.getElementById('errorSection');
    
    // Get form data
    const message = document.getElementById('messageInput').value;
    const type = document.getElementById('messageType').value;
    const sender = document.getElementById('senderInfo').value;
    const simpleMode = document.getElementById('simpleMode').checked;
    
    // Hide previous results/errors
    resultsSection.style.display = 'none';
    errorSection.style.display = 'none';
    
    // Show loading state
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-block';
    analyzeBtn.disabled = true;
    
    try {
        // Call API (mock for now)
        const result = await callAnalyzeAPI({ message, type, sender, simpleMode });
        
        // Populate results
        displayAnalysisResults(result);
        
        // Show results section
        resultsSection.style.display = 'block';
        
    } catch (error) {
        // Show error
        document.getElementById('errorMessage').textContent = error.message || 'Failed to analyze message. Please try again.';
        errorSection.style.display = 'block';
    } finally {
        // Reset button state
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
        analyzeBtn.disabled = false;
    }
}

function displayAnalysisResults(result) {
    // Update risk badge
    const riskBadge = document.getElementById('riskBadge');
    riskBadge.textContent = `${result.risk_level} Risk`;
    riskBadge.className = `risk-badge ${getRiskBadgeClass(result.risk_level)}`;
    
    // Show simple mode indicator if active
    const riskHeader = document.querySelector('.risk-header');
    const existingIndicator = riskHeader.querySelector('.simple-mode-indicator');
    if (existingIndicator) existingIndicator.remove();
    
    if (result.simple_mode) {
        const indicator = document.createElement('div');
        indicator.className = 'simple-mode-indicator';
        indicator.innerHTML = '📖 Simple Explanation Mode Active';
        riskHeader.appendChild(indicator);
    }
    
    // Show AI Community Alert if similar reports detected
    const communityAlertBanner = document.getElementById('communityAlertBanner');
    const similarCount = document.getElementById('similarCount');
    
    if (result.similar_reports_count && result.similar_reports_count > 0) {
        similarCount.textContent = result.similar_reports_count;
        communityAlertBanner.style.display = 'block';
    } else {
        communityAlertBanner.style.display = 'none';
    }
    
    // Update score value
    const scoreValue = document.getElementById('scoreValue');
    scoreValue.textContent = `${result.risk_score}/100`;
    scoreValue.style.color = getRiskColor(result.risk_level);
    
    // Animate score bar
    const scoreBar = document.getElementById('scoreBar');
    scoreBar.style.width = '0%';
    scoreBar.style.backgroundColor = getRiskColor(result.risk_level);
    
    setTimeout(() => {
        scoreBar.style.width = `${result.risk_score}%`;
    }, 100);
    
    // Populate tactics
    const tacticsContainer = document.getElementById('tacticsContainer');
    tacticsContainer.innerHTML = '';
    if (result.tactics && result.tactics.length > 0) {
        const tacticsList = document.createElement('ul');
        result.tactics.forEach(tactic => {
            const li = document.createElement('li');
            li.textContent = tactic;
            tacticsList.appendChild(li);
        });
        tacticsContainer.appendChild(tacticsList);
    } else {
        tacticsContainer.innerHTML = '<p class="text-muted">No specific tactics detected</p>';
    }
    
    // Populate signals
    const signalsContainer = document.getElementById('signalsContainer');
    signalsContainer.innerHTML = '';
    if (result.signals && result.signals.length > 0) {
        const signalsList = document.createElement('ul');
        result.signals.forEach(signal => {
            const li = document.createElement('li');
            li.textContent = signal;
            signalsList.appendChild(li);
        });
        signalsContainer.appendChild(signalsList);
    } else {
        signalsContainer.innerHTML = '<p class="text-muted">No warning signals detected</p>';
    }
    
    // Update intervention text
    const interventionText = document.getElementById('interventionText');
    const formattedIntervention = result.intervention.replace(/\n/g, '<br>');
    interventionText.innerHTML = `${formattedIntervention}${result.simple_mode_note ? `<p class="mode-note">${result.simple_mode_note}</p>` : ''}`;
    
    // Update technical details
    const technicalDetails = document.getElementById('technicalDetails');
    technicalDetails.innerHTML = `<p>${result.technical}</p>`;
}

function resetForm() {
    document.getElementById('analyzeForm').reset();
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('errorSection').style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function saveReport() {
    // TODO: Implement save to backend
    alert('Report saved successfully! (Backend integration pending)');
}

// ==========================================
// REAL BACKEND CONNECTION (Written by Aditi)
// ==========================================

// 1. Connect to the Agentic Triage API
async function callAnalyzeAPI(data) {
    try {
        const response = await fetch('http://127.0.0.1:8000/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            // Your backend AnalysisRequest schema expects {"text": "message..."}
            body: JSON.stringify({ text: data.message })
        });

        if (!response.ok) {
            throw new Error(`Backend error! Status: ${response.status}`);
        }

        const backendData = await response.json();

        // Calculate risk level for Isaac's CSS colors
        let riskLevel = "Low";
        if (backendData.risk_score >= 75) riskLevel = "High";
        else if (backendData.risk_score >= 40) riskLevel = "Medium";

        // Map your backend data to exactly what Isaac's frontend expects
        // Notice how we inject your Agentic user_emotion right into the UI!
        return {
            risk_score: backendData.risk_score,
            risk_level: riskLevel,
            tactics: [backendData.tactic], // Wraps string in an array for his UI
            signals: backendData.reasons,  // Maps your 'reasons' to his 'signals'
            intervention: `🛑 Target Emotion: ${backendData.user_emotion}\n\n${backendData.intervention_text}`,
            technical: `PII Redaction Engine output: ${backendData.redacted_text}`
        };

    } catch (error) {
        console.error("Fetch error:", error);
        throw new Error("Could not connect to Sentinel Backend. Is the FastAPI server running?");
    }
}

// 2. Connect the Community Database Endpoint
async function submitToCommunity() {
    if (confirm('Submit this report to the community database for threat detection?')) {
        
        // Grab the data currently on the screen
        const reportPayload = {
            message: document.getElementById('messageInput').value,
            type: document.getElementById('messageType').value,
            sender: document.getElementById('senderInfo').value || "Unknown",
            risk_score: parseInt(document.getElementById('scoreValue').innerText),
            risk_level: document.getElementById('riskBadge').innerText.split(" ")[0], // Grabs "High", "Medium", etc.
            tactics: Array.from(document.querySelectorAll('#tacticsContainer li')).map(li => li.innerText)
        };

        try {
            const response = await fetch('http://127.0.0.1:8000/api/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reportPayload)
            });

            if (response.ok) {
                alert('Success! Your Agent securely routed this report to the global database.');
            } else {
                alert('Failed to save to database.');
            }
        } catch (error) {
            console.error("Database error:", error);
            alert("Could not connect to database endpoint.");
        }
    }
}