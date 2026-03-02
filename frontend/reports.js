/* ===========================
   Reports Page Logic
   =========================== */

let allReports = [];
let filteredReports = [];

document.addEventListener('DOMContentLoaded', () => {
    loadReports();
});

async function loadReports() {
    const loadingReports = document.getElementById('loadingReports');
    const reportsList = document.getElementById('reportsList');
    const emptyState = document.getElementById('emptyState');
    const errorState = document.getElementById('errorState');
    
    // Show loading
    loadingReports.style.display = 'flex';
    reportsList.style.display = 'none';
    emptyState.style.display = 'none';
    errorState.style.display = 'none';
    
    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get reports from localStorage
        allReports = getMockReports();
        filteredReports = [...allReports];
        
        // Hide loading
        loadingReports.style.display = 'none';
        
        if (allReports.length === 0) {
            emptyState.style.display = 'flex';
        } else {
            reportsList.style.display = 'block';
            updateReportsStats();
            renderReports();
        }
        
    } catch (error) {
        loadingReports.style.display = 'none';
        errorState.style.display = 'block';
        document.getElementById('reportsError').textContent = error.message || 'Failed to load reports';
    }
}

function updateReportsStats() {
    const total = allReports.length;
    const high = allReports.filter(r => r.risk_level === 'High').length;
    const medium = allReports.filter(r => r.risk_level === 'Medium').length;
    const low = allReports.filter(r => r.risk_level === 'Low').length;
    
    document.getElementById('totalReports').textContent = total;
    document.getElementById('highRiskCount').textContent = high;
    document.getElementById('mediumRiskCount').textContent = medium;
    document.getElementById('lowRiskCount').textContent = low;
}

function renderReports() {
    const container = document.getElementById('reportsContainer');
    container.innerHTML = '';
    
    if (filteredReports.length === 0) {
        container.innerHTML = '<p class="text-muted" style="text-align: center; padding: 2rem;">No reports match your filter criteria</p>';
        return;
    }
    
    filteredReports.forEach(report => {
        const card = document.createElement('div');
        card.className = 'report-card';
        
        card.innerHTML = `
            <div class="report-header">
                <div class="report-meta">
                    <span class="report-id">#${report.id}</span>
                    <span class="report-time">${formatDate(report.timestamp)}</span>
                    <span class="report-type">${report.message_type.toUpperCase()}</span>
                </div>
                <span class="risk-badge ${getRiskBadgeClass(report.risk_level)}">${report.risk_level}</span>
            </div>
            
            <div class="report-content">
                <p class="report-snippet">"${report.message_snippet}"</p>
                
                <div class="report-details">
                    <div class="detail-item">
                        <strong>Risk Score:</strong> ${report.risk_score}/100
                    </div>
                    <div class="detail-item">
                        <strong>Sender:</strong> ${report.sender}
                    </div>
                    <div class="detail-item">
                        <strong>Tactics:</strong> ${report.tactics.join(', ')}
                    </div>
                </div>
            </div>
            
            <div class="report-actions">
                <button class="btn-link" onclick="viewReportDetails(${report.id})">View Full Analysis</button>
                <button class="btn-link" onclick="deleteReport(${report.id})">Delete</button>
            </div>
        `;
        
        container.appendChild(card);
    });
}

function filterReports() {
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();
    const riskFilter = document.getElementById('riskFilter').value;
    
    filteredReports = allReports.filter(report => {
        // Apply risk filter
        const matchesRisk = riskFilter === 'all' || report.risk_level.toLowerCase() === riskFilter;
        
        // Apply search filter
        const matchesSearch = 
            report.message_snippet.toLowerCase().includes(searchQuery) ||
            report.sender.toLowerCase().includes(searchQuery) ||
            report.tactics.some(t => t.toLowerCase().includes(searchQuery));
        
        return matchesRisk && matchesSearch;
    });
    
    renderReports();
}

function refreshReports() {
    const refreshIcon = document.getElementById('refreshIcon');
    refreshIcon.style.display = 'inline-block';
    refreshIcon.style.animation = 'spin 1s linear';
    
    loadReports().then(() => {
        setTimeout(() => {
            refreshIcon.style.animation = '';
        }, 1000);
    });
}

function viewReportDetails(reportId) {
    // TODO: Implement detailed view modal or navigation
    alert(`View details for report #${reportId} (Feature coming soon)`);
}

function deleteReport(reportId) {
    if (confirm('Are you sure you want to delete this report?')) {
        // TODO: Call backend API to delete
        allReports = allReports.filter(r => r.id !== reportId);
        filteredReports = filteredReports.filter(r => r.id !== reportId);
        updateReportsStats();
        renderReports();
    }
}
