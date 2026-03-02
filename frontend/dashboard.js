/* ===========================
   Dashboard Page Logic
   =========================== */

// Mock data
const MOCK_DASHBOARD_DATA = {
    metrics: {
        totalThreats: 23,
        affectedUsers: 147,
        campaignsDetected: 4,
        preventedAttacks: 89
    },
    campaigns: [
        {
            id: 1,
            name: "Fake Government Fine SMS",
            report_count: 12,
            risk_level: "High",
            common_tactic: "Authority + Fear",
            indicators: {
                domains: ["gov-sg-fines.com", "sgfine-pay.net"],
                phone_numbers: ["+65-9123-XXXX", "+65-8234-XXXX"]
            },
            first_seen: "2026-03-01T14:30:00",
            last_seen: "2026-03-02T09:15:00",
            description: "SMS claiming unpaid government fines with payment link"
        },
        {
            id: 2,
            name: "Bank Account Verification",
            report_count: 8,
            risk_level: "High",
            common_tactic: "Urgency + Authority",
            indicators: {
                domains: ["dbs-verify.com", "ocbc-secure-login.net"],
                phone_numbers: []
            },
            first_seen: "2026-02-28T10:00:00",
            last_seen: "2026-03-02T08:30:00",
            description: "Phishing emails requesting account verification"
        },
        {
            id: 3,
            name: "Package Delivery Scam",
            report_count: 3,
            risk_level: "Medium",
            common_tactic: "Urgency",
            indicators: {
                domains: ["track-parcel-sg.com"],
                phone_numbers: ["+65-9876-YYYY"]
            },
            first_seen: "2026-03-01T16:45:00",
            last_seen: "2026-03-01T20:10:00",
            description: "Fake delivery notifications with tracking links"
        }
    ],
    tactics: {
        fear: 45,
        authority: 67,
        urgency: 82,
        reward: 34
    },
    advisories: [
        {
            title: "High Alert: Government Fine SMS Campaign",
            severity: "critical",
            date: "2026-03-02T09:00:00",
            message: "Multiple reports of SMS messages claiming unpaid government fines. Do not click links. Verify through official channels."
        },
        {
            title: "Banking Phishing Surge",
            severity: "high",
            date: "2026-03-01T15:30:00",
            message: "Increase in fake bank verification emails. Check sender address carefully."
        },
        {
            title: "Weekend Delivery Scams Expected",
            severity: "medium",
            date: "2026-02-28T18:00:00",
            message: "Historical pattern shows delivery scams increase on weekends."
        }
    ]
};

document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
});

async function loadDashboard() {
    const loadingDashboard = document.getElementById('loadingDashboard');
    const dashboardContent = document.getElementById('dashboardContent');
    const errorStateDashboard = document.getElementById('errorStateDashboard');
    
    // Show loading
    loadingDashboard.style.display = 'flex';
    dashboardContent.style.display = 'none';
    errorStateDashboard.style.display = 'none';
    
    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Use mock data
        const data = MOCK_DASHBOARD_DATA;
        
        // Populate dashboard
        populateMetrics(data.metrics);
        populateCampaigns(data.campaigns);
        populateTacticsChart(data.tactics);
        populateAdvisories(data.advisories);
        updateLastUpdated();
        
        // Show dashboard
        loadingDashboard.style.display = 'none';
        dashboardContent.style.display = 'block';
        
    } catch (error) {
        loadingDashboard.style.display = 'none';
        errorStateDashboard.style.display = 'block';
        document.getElementById('dashboardError').textContent = error.message || 'Failed to load dashboard data';
    }
}

function populateMetrics(metrics) {
    document.getElementById('totalThreats').textContent = metrics.totalThreats;
    document.getElementById('affectedUsers').textContent = metrics.affectedUsers;
    document.getElementById('campaignsDetected').textContent = metrics.campaignsDetected;
    document.getElementById('preventedAttacks').textContent = metrics.preventedAttacks;
    
    // Mock percentage changes
    document.getElementById('threatsChange').textContent = '+8% from last week';
    document.getElementById('threatsChange').className = 'metric-change negative';
    
    document.getElementById('usersChange').textContent = '+12% from last week';
    document.getElementById('usersChange').className = 'metric-change negative';
    
    document.getElementById('campaignsChange').textContent = '+1 new campaign';
    document.getElementById('campaignsChange').className = 'metric-change negative';
    
    document.getElementById('preventedChange').textContent = '+23% from last week';
    document.getElementById('preventedChange').className = 'metric-change positive';
}

function populateCampaigns(campaigns) {
    const container = document.getElementById('campaignsContainer');
    container.innerHTML = '';
    
    if (!campaigns || campaigns.length === 0) {
        container.innerHTML = '<p class="text-muted">No active campaigns detected</p>';
        return;
    }
    
    campaigns.forEach(campaign => {
        const card = document.createElement('div');
        
        // CRITICAL: Check if campaign is detected (>= 5 reports)
        const isCampaignDetected = campaign.report_count >= 5;
        
        if (isCampaignDetected) {
            card.className = 'campaign-card campaign-detected';
        } else {
            card.className = 'campaign-card';
        }
        
        card.innerHTML = `
            <div class="campaign-header">
                <div>
                    <h3>${campaign.name}</h3>
                    ${isCampaignDetected ? '<span class="campaign-badge">🚨 Campaign Detected</span>' : ''}
                </div>
                <span class="risk-badge ${getRiskBadgeClass(campaign.risk_level)}">${campaign.risk_level}</span>
            </div>
            <div class="campaign-details">
                <p><strong>Reports:</strong> ${campaign.report_count}</p>
                <p><strong>Common Tactic:</strong> ${campaign.common_tactic}</p>
                <p><strong>First Seen:</strong> ${formatDate(campaign.first_seen)}</p>
                <p><strong>Last Seen:</strong> ${formatDate(campaign.last_seen)}</p>
                <p class="campaign-description">${campaign.description}</p>
                
                <div class="campaign-indicators">
                    <strong>Indicators:</strong>
                    ${campaign.indicators.domains.length > 0 ? `
                        <div class="indicator-group">
                            <span class="indicator-label">🌐 Domains:</span>
                            ${campaign.indicators.domains.map(d => `<span class="indicator-tag">${d}</span>`).join('')}
                        </div>
                    ` : ''}
                    ${campaign.indicators.phone_numbers.length > 0 ? `
                        <div class="indicator-group">
                            <span class="indicator-label">📱 Phone:</span>
                            ${campaign.indicators.phone_numbers.map(p => `<span class="indicator-tag">${p}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
            <div class="campaign-actions">
                <button class="btn btn-primary btn-sm" onclick="generateAdvisory(${campaign.id})">
                    📢 Generate Advisory
                </button>
                <button class="btn btn-outline btn-sm" onclick="downloadPacket(${campaign.id})">
                    📥 Download Authority Packet
                </button>
            </div>
        `;
        
        container.appendChild(card);
    });
}

function populateTacticsChart(tactics) {
    const maxValue = Math.max(tactics.fear, tactics.authority, tactics.urgency, tactics.reward);
    
    // Animate fear bar
    setTimeout(() => {
        const fearBar = document.getElementById('fearBar');
        const fearPercentage = (tactics.fear / maxValue) * 100;
        fearBar.style.width = `${fearPercentage}%`;
        document.getElementById('fearCount').textContent = tactics.fear;
    }, 200);
    
    // Animate authority bar
    setTimeout(() => {
        const authorityBar = document.getElementById('authorityBar');
        const authorityPercentage = (tactics.authority / maxValue) * 100;
        authorityBar.style.width = `${authorityPercentage}%`;
        document.getElementById('authorityCount').textContent = tactics.authority;
    }, 400);
    
    // Animate urgency bar
    setTimeout(() => {
        const urgencyBar = document.getElementById('urgencyBar');
        const urgencyPercentage = (tactics.urgency / maxValue) * 100;
        urgencyBar.style.width = `${urgencyPercentage}%`;
        document.getElementById('urgencyCount').textContent = tactics.urgency;
    }, 600);
    
    // Animate reward bar
    setTimeout(() => {
        const rewardBar = document.getElementById('rewardBar');
        const rewardPercentage = (tactics.reward / maxValue) * 100;
        rewardBar.style.width = `${rewardPercentage}%`;
        document.getElementById('rewardCount').textContent = tactics.reward;
    }, 800);
}

function populateAdvisories(advisories) {
    const container = document.getElementById('advisoriesContainer');
    container.innerHTML = '';
    
    if (!advisories || advisories.length === 0) {
        container.innerHTML = '<p class="text-muted">No active advisories</p>';
        return;
    }
    
    advisories.forEach(advisory => {
        const card = document.createElement('div');
        card.className = `advisory-card advisory-${advisory.severity}`;
        
        card.innerHTML = `
            <div class="advisory-header">
                <h4>${advisory.title}</h4>
                <span class="advisory-date">${formatDate(advisory.date)}</span>
            </div>
            <p>${advisory.message}</p>
        `;
        
        container.appendChild(card);
    });
}

function updateLastUpdated() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('lastUpdated').textContent = timeString;
}

function refreshDashboard() {
    loadDashboard();
}

function generateAdvisory(campaignId) {
    // TODO: Call backend API to generate advisory
    alert(`Generating community advisory for campaign #${campaignId}...\n\nThis will create a public alert with actionable guidance for community members. (Backend integration pending)`);
}

function downloadPacket(campaignId) {
    // TODO: Call backend API to download authority packet
    alert(`Preparing authority packet for campaign #${campaignId}...\n\nThis package includes:\n• Clustered evidence\n• Technical indicators\n• Timeline of reports\n• Recommended actions\n\n(Backend integration pending)`);
}
