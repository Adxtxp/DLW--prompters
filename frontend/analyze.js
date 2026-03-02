/* ===========================
   Analyze Page Logic
   =========================== */

// Store current analysis data for saving
let currentAnalysisData = null;

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('analyzeForm');
    const submitBtn = document.getElementById('submitCommunityBtn');
    
    if (form) {
        form.addEventListener('submit', handleAnalyzeSubmit);
    }
    
    if (submitBtn) {
        submitBtn.addEventListener('click', handleSubmitToCommunity);
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
    const pipeline = document.getElementById('agentPipeline');
    
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
    
    // Show agentic pipeline
    pipeline.style.display = 'block';
    resetPipelineSteps();
    
    try {
        // Agent 1: Understand (PII redaction + tactic detection)
        activateStep('understand');
        await sleep(400);
        
        // Call API (real backend with fallback)
        const result = await callAnalyzeAPI({ message, type, sender, simpleMode });
        completeStep('understand');
        
        // Agent 2: Cognitive Reset (intervention text generation)
        activateStep('cognitive');
        await sleep(500);
        completeStep('cognitive');
        
        // Agent 3: Investigation (cluster matching)
        activateStep('investigate');
        await sleep(600);
        completeStep('investigate');
        
        // Agent 4: Escalation (campaign check) — icon reflects severity level
        activateStep('escalate');
        await sleep(400);
        const sc = result.similar_reports_count || 1;
        if (sc >= 5) {
            completeStep('escalate', '🚨');
        } else if (sc === 4) {
            completeStep('escalate', '🔴');
        } else if (sc >= 2) {
            completeStep('escalate', '🟡');
        } else {
            completeStep('escalate', '🟢');
        }
        // Also update the escalate step description with live count
        const stepDesc = document.querySelector('#step-escalate .step-desc');
        if (stepDesc) stepDesc.textContent = `Report #${sc} — ${sc >= 5 ? 'Campaign confirmed, authorities notified' : sc === 4 ? 'Serious threat, 1 away from escalation' : sc >= 2 ? 'Emerging pattern detected' : 'First report, monitoring started'}`;
        
        // Store the analysis data for saving later
        currentAnalysisData = {
            message: message,
            message_type: type,
            sender: sender,
            simple_mode: simpleMode,
            risk_score: result.risk_score,
            risk_level: result.risk_level,
            tactics: result.tactics,
            signals: result.signals,
            intervention: result.intervention,
            similar_reports_count: result.similar_reports_count,
            technical: result.technical,
            timestamp: new Date().toISOString(),
            redacted_text: result.redacted_text,
            tactic_raw: result.tactic_raw,
            _source: result._source
        };
        
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

/* Pipeline animation helpers */
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function resetPipelineSteps() {
    ['understand', 'cognitive', 'investigate', 'escalate'].forEach(id => {
        const step = document.getElementById(`step-${id}`);
        const status = document.getElementById(`status-${id}`);
        step.className = 'pipeline-step';
        status.textContent = '⏳';
    });
}

function activateStep(id) {
    const step = document.getElementById(`step-${id}`);
    step.classList.add('step-active');
    document.getElementById(`status-${id}`).textContent = '⚙️';
}

function completeStep(id, icon) {
    const step = document.getElementById(`step-${id}`);
    step.classList.remove('step-active');
    step.classList.add('step-done');
    document.getElementById(`status-${id}`).textContent = icon || '✅';
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
    
    // 5-level escalation banner — count = existing similar + 1 (this report)
    const communityAlertBanner = document.getElementById('communityAlertBanner');
    const count = result.similar_reports_count || 1;
    
    communityAlertBanner.style.display = 'block';
    
    if (count >= 5) {
        // Level 5 — Campaign confirmed, authorities alerted
        communityAlertBanner.className = 'community-alert-banner alert-level-5';
        communityAlertBanner.innerHTML = `
            🚨 <strong>CAMPAIGN VERIFIED — ALERTING AUTHORITIES</strong><br>
            <span class="alert-sub">Investigation Agent has TF-IDF clustered <strong>${count} matching reports</strong>.
            This is a <strong>confirmed coordinated attack</strong>. Authority packet auto-generated.
            <a href="dashboard.html" class="alert-link">Download Authority Packet →</a></span>
        `;
    } else if (count === 4) {
        // Level 4 — Serious threat, 1 away from campaign
        communityAlertBanner.className = 'community-alert-banner alert-level-4';
        communityAlertBanner.innerHTML = `
            🔴 <strong>SERIOUS THREAT — ${count} reports detected</strong><br>
            <span class="alert-sub">Pattern growing rapidly. <strong>1 more report</strong> will trigger full campaign escalation and authority notification.</span>
        `;
    } else if (count === 3) {
        // Level 3 — Emerging pattern
        communityAlertBanner.className = 'community-alert-banner alert-level-3';
        communityAlertBanner.innerHTML = `
            🟠 <strong>EMERGING PATTERN — ${count} similar reports detected</strong><br>
            <span class="alert-sub">Investigation Agent is clustering similar reports. <strong>${5 - count} more</strong> needed to trigger authority escalation.</span>
        `;
    } else if (count === 2) {
        // Level 2 — Emerging pattern
        communityAlertBanner.className = 'community-alert-banner alert-level-2';
        communityAlertBanner.innerHTML = `
            🟡 <strong>EMERGING PATTERN — ${count} similar reports detected</strong><br>
            <span class="alert-sub">A second matching report has been detected. System is monitoring for further activity. <strong>${5 - count} more</strong> needed to escalate.</span>
        `;
    } else {
        // Level 1 — First report, start monitoring
        communityAlertBanner.className = 'community-alert-banner alert-level-1';
        communityAlertBanner.innerHTML = `
            🟢 <strong>FIRST REPORT — System Monitoring</strong><br>
            <span class="alert-sub">This is the first report of this pattern. Sentinel is now monitoring for similar messages from the community.</span>
        `;
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
    currentAnalysisData = null; // Clear stored data
    
    // Reset submit to community button if it exists
    const submitBtn = document.getElementById('submitCommunityBtn');
    if (submitBtn) {
        submitBtn.textContent = 'Submit to Community';
        submitBtn.disabled = false;
        submitBtn.classList.remove('btn-success');
        submitBtn.classList.add('btn-primary');
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function handleSubmitToCommunity(event) {
    event.preventDefault();
    
    // Check if there's data to save
    if (!currentAnalysisData) {
        alert('❌ Please analyze a message first before submitting.');
        return;
    }
    
    // Get the submit button
    const submitBtn = document.getElementById('submitCommunityBtn');
    if (!submitBtn) return;
    
    // Disable button and show loading state
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;
    
    try {
        // Extract domain/phone from message for backend
        const message = currentAnalysisData.message || '';
        const domainMatch = message.match(/https?:\/\/([^\s\/]+)/i) || message.match(/(?:www\.)?([a-z0-9-]+\.[a-z]{2,})/i);
        const phoneMatch = message.match(/\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/);
        
        const extractedDomain = domainMatch ? domainMatch[1] || domainMatch[0] : '';
        const extractedPhone = phoneMatch ? phoneMatch[0] : '';
        
        // POST to backend /report endpoint
        const backendPayload = {
            redacted_text: currentAnalysisData.redacted_text || currentAnalysisData.message.substring(0, 200),
            tactic: currentAnalysisData.tactic_raw || currentAnalysisData.tactics.join(' + ').toLowerCase(),
            extracted_domain: extractedDomain,
            extracted_phone: extractedPhone,
            timestamp: currentAnalysisData.timestamp
        };
        
        const backendResult = await callSaveReportAPI(backendPayload);
        
        // Also save to localStorage for local UI
        const reportToSave = {
            timestamp: currentAnalysisData.timestamp,
            message_snippet: currentAnalysisData.message.substring(0, 100) + (currentAnalysisData.message.length > 100 ? '...' : ''),
            message_type: currentAnalysisData.message_type,
            risk_level: currentAnalysisData.risk_level,
            risk_score: currentAnalysisData.risk_score,
            tactics: currentAnalysisData.tactics,
            sender: currentAnalysisData.sender || 'Unknown',
            extracted_domain: extractedDomain,
            extracted_phone: extractedPhone
        };
        
        const savedReport = saveMockReport(reportToSave);
        
        // Success! Update button
        submitBtn.textContent = '✅ Submitted to Community';
        submitBtn.classList.remove('btn-primary');
        submitBtn.classList.add('btn-success');
        
        const sourceMsg = backendResult._source === 'local' ? '(saved locally — backend offline)' : '(synced with backend)';
        alert(`✅ Report Submitted!\n\nReport ID: #${backendResult.report_id || savedReport.id}\n${sourceMsg}\n\nThe Investigation Agent will now cluster this with similar reports.\nCheck the Dashboard to see if a campaign is detected.`);
        
    } catch (error) {
        console.error('Failed to submit report:', error);
        alert('❌ Failed to submit report. Please try again.');
        submitBtn.textContent = 'Submit to Community';
        submitBtn.disabled = false;
    }
}
