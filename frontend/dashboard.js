/* ===========================
   Dashboard Page Logic
   =========================== */

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
        
        // Get reports from localStorage and calculate dashboard data
        const reports = getMockReports();
        
        // Calculate metrics dynamically
        const metrics = {
            totalThreats: reports.length,
            affectedUsers: reports.length * 6, // Rough estimate
            campaignsDetected: Math.floor(reports.filter(r => r.risk_level === 'High').length / 3),
            preventedAttacks: reports.length * 4 // Rough estimate
        };
        
        // Group similar reports into campaigns (simplified clustering)
        const campaigns = [];
        const tacticGroups = {};
        
        reports.forEach(report => {
            const tacticKey = report.tactics.join('+');
            if (!tacticGroups[tacticKey]) {
                tacticGroups[tacticKey] = [];
            }
            tacticGroups[tacticKey].push(report);
        });
        
        Object.keys(tacticGroups).forEach((tacticKey, index) => {
            const group = tacticGroups[tacticKey];
            if (group.length >= 2) { // Only show as campaign if 2+ reports
                const highestRisk = group.reduce((max, r) => r.risk_score > max ? r.risk_score : max, 0);
                const riskLevel = highestRisk >= 70 ? 'High' : (highestRisk >= 40 ? 'Medium' : 'Low');
                
                campaigns.push({
                    id: index + 1,
                    name: `${tacticKey} Campaign`,
                    report_count: group.length,
                    risk_level: riskLevel,
                    common_tactic: tacticKey,
                    indicators: {
                        domains: [],
                        phone_numbers: group.map(r => r.sender).filter(s => s.includes('+'))
                    },
                    first_seen: group[group.length - 1].timestamp,
                    last_seen: group[0].timestamp,
                    description: `Detected ${group.length} similar messages using ${tacticKey} tactics`
                });
            }
        });
        
        // Calculate tactics distribution
        const tacticsCount = { fear: 0, authority: 0, urgency: 0, reward: 0 };
        reports.forEach(report => {
            report.tactics.forEach(tactic => {
                const key = tactic.toLowerCase();
                if (tacticsCount[key] !== undefined) {
                    tacticsCount[key]++;
                }
            });
        });
        
        // Generate advisories based on campaigns
        const advisories = campaigns
            .filter(c => c.report_count >= 5)
            .map(c => ({
                title: `Campaign Alert: ${c.name}`,
                severity: c.risk_level === 'High' ? 'critical' : 'high',
                date: c.last_seen,
                message: `${c.report_count} reports detected using ${c.common_tactic} tactics. Exercise extreme caution.`
            }));
        
        if (advisories.length === 0) {
            advisories.push({
                title: "Community Monitoring Active",
                severity: "medium",
                date: new Date().toISOString(),
                message: "No major campaigns detected. Continue reporting suspicious messages."
            });
        }
        
        const data = {
            metrics: metrics,
            campaigns: campaigns.length > 0 ? campaigns : [{
                id: 1,
                name: "No Active Campaigns",
                report_count: 0,
                risk_level: "Low",
                common_tactic: "None",
                indicators: { domains: [], phone_numbers: [] },
                first_seen: new Date().toISOString(),
                last_seen: new Date().toISOString(),
                description: "System is actively monitoring for patterns"
            }],
            tactics: tacticsCount,
            advisories: advisories
        };
        
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
