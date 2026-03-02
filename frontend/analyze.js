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
            timestamp: new Date().toISOString()
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

function handleSubmitToCommunity(event) {
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
        // Prepare report data for saving
        const reportToSave = {
            timestamp: currentAnalysisData.timestamp,
            message_snippet: currentAnalysisData.message.substring(0, 100) + (currentAnalysisData.message.length > 100 ? '...' : ''),
            message_type: currentAnalysisData.message_type,
            risk_level: currentAnalysisData.risk_level,
            risk_score: currentAnalysisData.risk_score,
            tactics: currentAnalysisData.tactics,
            sender: currentAnalysisData.sender || 'Unknown'
        };
        
        // Save to localStorage mock database
        const savedReport = saveMockReport(reportToSave);
        
        // Success! Update button
        submitBtn.textContent = '✅ Saved to Community';
        submitBtn.classList.remove('btn-primary');
        submitBtn.classList.add('btn-success');
        
        // Show success message
        alert(`✅ Success!\n\nYour report has been submitted to the community database.\nReport ID: #${savedReport.id}\n\nThis helps protect others from similar scams.\n\nView all reports on the Reports page.`);
        
    } catch (error) {
        // Error handling
        console.error('Failed to submit report:', error);
        alert('❌ Failed to submit report. Please try again.');
        
        // Reset button on error
        submitBtn.textContent = 'Submit to Community';
        submitBtn.disabled = false;
    }
}
