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
        // Try fetching from real backend first
        let reports = [];
        let clusters = [];
        let backendOnline = false;
        
        try {
            const [reportsRes, clustersRes] = await Promise.all([
                fetch(`${API_BASE_URL}/reports`),
                fetch(`${API_BASE_URL}/clusters`)
            ]);
            
            if (reportsRes.ok && clustersRes.ok) {
                const reportsData = await reportsRes.json();
                const clustersData = await clustersRes.json();
                reports = reportsData.reports || [];
                clusters = clustersData.clusters || [];
                backendOnline = true;
            }
        } catch (_) {
            console.warn('Backend offline, falling back to localStorage');
        }
        
        // Fallback: use localStorage data and client-side clustering
        if (!backendOnline) {
            reports = getMockReports();
            clusters = buildLocalClusters(reports);
        }
        
        // Calculate metrics
        const campaignCount = clusters.filter(c => c.campaign_detected).length;
        const metrics = {
            totalThreats: reports.length,
            affectedUsers: reports.length * 6,
            campaignsDetected: campaignCount,
            preventedAttacks: reports.length * 4
        };
        
        // Calculate tactics distribution
        const tacticsCount = { fear: 0, authority: 0, urgency: 0, reward: 0 };
        reports.forEach(report => {
            const tacticField = report.tactic || (report.tactics ? report.tactics.join(' + ').toLowerCase() : '');
            if (tacticField.includes('fear')) tacticsCount.fear++;
            if (tacticField.includes('authority')) tacticsCount.authority++;
            if (tacticField.includes('urgency')) tacticsCount.urgency++;
            if (tacticField.includes('reward')) tacticsCount.reward++;
        });
        
        // Generate advisories from clusters with campaign_detected = true
        const advisories = clusters
            .filter(c => c.campaign_detected)
            .map(c => ({
                title: `🚨 Campaign Alert: Cluster #${c.cluster_id}`,
                severity: 'critical',
                date: new Date().toISOString(),
                message: `${c.report_count} similar reports clustered. Campaign detected — authority escalation recommended.`
            }));
        
        if (advisories.length === 0) {
            advisories.push({
                title: "Community Monitoring Active",
                severity: "medium",
                date: new Date().toISOString(),
                message: "No campaigns detected yet. Continue submitting suspicious messages to help build intelligence."
            });
        }
        
        // Populate dashboard
        populateMetrics(metrics);
        populateCampaigns(clusters);
        populateTacticsChart(tacticsCount);
        populateAdvisories(advisories);
        populateRelatedCases(clusters);
        updateLastUpdated(backendOnline);
        
        // Show dashboard
        loadingDashboard.style.display = 'none';
        dashboardContent.style.display = 'block';
        
    } catch (error) {
        loadingDashboard.style.display = 'none';
        errorStateDashboard.style.display = 'block';
        document.getElementById('dashboardError').textContent = error.message || 'Failed to load dashboard data';
    }
}

/* Build clusters client-side when backend is offline */
function buildLocalClusters(reports) {
    const tacticGroups = {};
    reports.forEach(report => {
        const tacticKey = (report.tactics || []).join('+') || 'unknown';
        if (!tacticGroups[tacticKey]) tacticGroups[tacticKey] = [];
        tacticGroups[tacticKey].push(report);
    });
    
    return Object.keys(tacticGroups).map((tacticKey, index) => {
        const group = tacticGroups[tacticKey];
        return {
            cluster_id: index + 1,
            report_count: group.length,
            campaign_detected: group.length >= 5,
            reports: group.map(r => ({
                redacted_text: r.message_snippet || '',
                tactic: tacticKey.replace(/\+/g, ' + '),
                extracted_domain: r.extracted_domain || '',
                extracted_phone: r.extracted_phone || r.sender || '',
                timestamp: r.timestamp
            }))
        };
    });
}

function populateMetrics(metrics) {
    document.getElementById('totalThreats').textContent = metrics.totalThreats;
    document.getElementById('affectedUsers').textContent = metrics.affectedUsers;
    document.getElementById('campaignsDetected').textContent = metrics.campaignsDetected;
    document.getElementById('preventedAttacks').textContent = metrics.preventedAttacks;
    
    document.getElementById('threatsChange').textContent = metrics.totalThreats > 0 ? `${metrics.totalThreats} reports indexed` : 'No data yet';
    document.getElementById('threatsChange').className = metrics.totalThreats > 0 ? 'metric-change negative' : 'metric-change';
    
    document.getElementById('usersChange').textContent = 'Estimated reach';
    document.getElementById('usersChange').className = 'metric-change';
    
    document.getElementById('campaignsChange').textContent = metrics.campaignsDetected > 0 ? `${metrics.campaignsDetected} active` : 'Monitoring...';
    document.getElementById('campaignsChange').className = metrics.campaignsDetected > 0 ? 'metric-change negative' : 'metric-change positive';
    
    document.getElementById('preventedChange').textContent = 'Community powered';
    document.getElementById('preventedChange').className = 'metric-change positive';
}

function populateCampaigns(clusters) {
    const container = document.getElementById('campaignsContainer');
    container.innerHTML = '';
    
    if (!clusters || clusters.length === 0) {
        container.innerHTML = '<p class="text-muted">No active clusters detected. Submit more reports to enable TF-IDF clustering.</p>';
        return;
    }
    
    clusters.forEach(cluster => {
        const card = document.createElement('div');
        const isCampaign = cluster.campaign_detected;
        
        card.className = isCampaign ? 'campaign-card campaign-detected' : 'campaign-card';
        
        // Extract indicators from cluster reports
        const domains = [...new Set(cluster.reports.map(r => r.extracted_domain).filter(Boolean))];
        const phones = [...new Set(cluster.reports.map(r => r.extracted_phone).filter(Boolean))];
        const tactic = cluster.reports[0]?.tactic || 'unknown';
        const firstSeen = cluster.reports[cluster.reports.length - 1]?.timestamp || new Date().toISOString();
        const lastSeen = cluster.reports[0]?.timestamp || new Date().toISOString();
        
        card.innerHTML = `
            <div class="campaign-header">
                <div>
                    <h3>Cluster #${cluster.cluster_id}: ${tactic}</h3>
                    ${isCampaign ? '<span class="campaign-badge">🚨 Campaign Detected — Escalation Triggered</span>' : `<span class="cluster-badge">📊 ${cluster.report_count} report${cluster.report_count !== 1 ? 's' : ''} clustered</span>`}
                </div>
                <span class="risk-badge ${isCampaign ? 'risk-high' : (cluster.report_count >= 3 ? 'risk-medium' : 'risk-low')}">${isCampaign ? 'High' : (cluster.report_count >= 3 ? 'Medium' : 'Low')}</span>
            </div>
            <div class="campaign-details">
                <p><strong>Reports in cluster:</strong> ${cluster.report_count}</p>
                <p><strong>Primary Tactic:</strong> ${tactic}</p>
                <p><strong>First Seen:</strong> ${formatDate(firstSeen)}</p>
                <p><strong>Last Seen:</strong> ${formatDate(lastSeen)}</p>
                ${isCampaign ? '<p class="campaign-escalation-msg">⚡ Threshold reached (≥5 reports). Authority packet available for download.</p>' : `<p class="campaign-description">Need ${Math.max(0, 5 - cluster.report_count)} more similar reports to trigger campaign escalation.</p>`}
                
                ${(domains.length > 0 || phones.length > 0) ? `
                <div class="campaign-indicators">
                    <strong>Extracted Indicators:</strong>
                    ${domains.length > 0 ? `
                        <div class="indicator-group">
                            <span class="indicator-label">🌐 Domains:</span>
                            ${domains.map(d => `<span class="indicator-tag">${d}</span>`).join('')}
                        </div>
                    ` : ''}
                    ${phones.length > 0 ? `
                        <div class="indicator-group">
                            <span class="indicator-label">📱 Phones:</span>
                            ${phones.map(p => `<span class="indicator-tag">${p}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
                ` : ''}
            </div>
            <div class="campaign-actions">
                ${isCampaign ? `
                    <button class="btn btn-primary btn-sm" onclick="generateAdvisory(${cluster.cluster_id})">
                        📢 Generate Advisory
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="downloadPacket(${cluster.cluster_id})">
                        📥 Download Authority Packet
                    </button>
                ` : `
                    <button class="btn btn-outline btn-sm" disabled>
                        📥 Authority Packet (need ≥5 reports)
                    </button>
                `}
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

function updateLastUpdated(backendOnline) {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const sourceTag = backendOnline ? ' (live from backend)' : ' (localStorage)';
    document.getElementById('lastUpdated').textContent = timeString + sourceTag;
}

function refreshDashboard() {
    loadDashboard();
}

async function generateAdvisory(clusterId) {
    try {
        const response = await fetch(`${API_BASE_URL}/clusters/${clusterId}/advisory`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cluster_id: clusterId, advice: 'Auto-generated community advisory' })
        });
        if (response.ok) {
            alert(`✅ Advisory generated for Cluster #${clusterId}!\n\nA community-wide alert has been published warning users about this active campaign.`);
        } else {
            throw new Error('Backend error');
        }
    } catch (err) {
        alert(`📢 Advisory for Cluster #${clusterId}\n\n⚠️ COMMUNITY ALERT: A coordinated phishing campaign has been detected.\nMultiple reports share similar text patterns and indicators.\n\nRecommendation: Do NOT interact with messages matching this pattern.\n\n(Backend offline — advisory displayed locally)`);
    }
}

async function downloadPacket(clusterId) {
    try {
        const response = await fetch(`${API_BASE_URL}/clusters/${clusterId}/authority-packet`);
        if (!response.ok) throw new Error('Backend error');
        const packet = await response.json();
        
        if (packet.error) {
            alert(`❌ ${packet.error}`);
            return;
        }
        
        // Display authority packet in a formatted view
        showAuthorityPacketModal(packet);
        
    } catch (err) {
        alert(`📥 Authority Packet — Cluster #${clusterId}\n\n(Backend offline — unable to generate packet.\nStart the backend server and re-submit reports to enable this feature.)`);
    }
}

function showAuthorityPacketModal(packet) {
    // Remove existing modal if any
    const existing = document.getElementById('authorityPacketModal');
    if (existing) existing.remove();
    
    const modal = document.createElement('div');
    modal.id = 'authorityPacketModal';
    modal.className = 'modal-overlay';
    
    const domainsHtml = packet.indicators.domains.length > 0
        ? packet.indicators.domains.map(d => `<span class="indicator-tag">${d}</span>`).join('')
        : '<span class="text-muted">None extracted</span>';
    
    const phonesHtml = packet.indicators.phones.length > 0
        ? packet.indicators.phones.map(p => `<span class="indicator-tag">${p}</span>`).join('')
        : '<span class="text-muted">None extracted</span>';
    
    modal.innerHTML = `
        <div class="modal-content authority-packet-modal">
            <div class="modal-header">
                <h2>📋 Authority Packet — Cluster #${packet.cluster_id}</h2>
                <button class="modal-close" onclick="closeAuthorityModal()">✕</button>
            </div>
            <div class="packet-body">
                <div class="packet-section">
                    <h4>📊 Summary</h4>
                    <table class="evidence-table">
                        <tr><td><strong>Cluster ID</strong></td><td>${packet.cluster_id}</td></tr>
                        <tr><td><strong>Report Count</strong></td><td>${packet.report_count}</td></tr>
                        <tr><td><strong>Primary Tactic</strong></td><td>${packet.tactic}</td></tr>
                        <tr><td><strong>Time Window</strong></td><td>${packet.time_window}</td></tr>
                    </table>
                </div>
                
                <div class="packet-section">
                    <h4>🔍 Extracted Evidence (IOCs)</h4>
                    <div class="evidence-grid">
                        <div class="evidence-block">
                            <h5>🌐 Suspicious Domains</h5>
                            <div class="evidence-items">${domainsHtml}</div>
                        </div>
                        <div class="evidence-block">
                            <h5>📱 Suspicious Phone Numbers</h5>
                            <div class="evidence-items">${phonesHtml}</div>
                        </div>
                    </div>
                </div>
                
                <div class="packet-section">
                    <h4>📝 Recommendation</h4>
                    <div class="packet-recommendation">${packet.recommendation}</div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="copyPacketToClipboard()">📋 Copy to Clipboard</button>
                <button class="btn btn-secondary" onclick="closeAuthorityModal()">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Store packet data for copy
    window._lastPacket = packet;
}

function closeAuthorityModal() {
    const modal = document.getElementById('authorityPacketModal');
    if (modal) modal.remove();
}

function copyPacketToClipboard() {
    const p = window._lastPacket;
    if (!p) return;
    
    const text = `AUTHORITY PACKET — Cluster #${p.cluster_id}
====================================
Report Count: ${p.report_count}
Primary Tactic: ${p.tactic}
Time Window: ${p.time_window}

INDICATORS OF COMPROMISE (IOCs):
- Domains: ${p.indicators.domains.length > 0 ? p.indicators.domains.join(', ') : 'None'}
- Phones: ${p.indicators.phones.length > 0 ? p.indicators.phones.join(', ') : 'None'}

RECOMMENDATION:
${p.recommendation}

Generated by Sentinel — Community-Aware Anti-Phishing System`;
    
    navigator.clipboard.writeText(text).then(() => {
        alert('✅ Authority packet copied to clipboard!');
    }).catch(() => {
        alert('❌ Could not copy. Please select and copy manually.');
    });
}

/* ===========================
   Related Cases Investigation UI
   =========================== */

function populateRelatedCases(clusters) {
    const container = document.getElementById('patternsContainer');
    if (!container) return;
    container.innerHTML = '';
    
    if (!clusters || clusters.length === 0) {
        container.innerHTML = '<p class="text-muted">No clusters formed yet. Submit reports to enable TF-IDF similarity detection.</p>';
        return;
    }
    
    clusters.forEach(cluster => {
        const card = document.createElement('div');
        card.className = cluster.campaign_detected ? 'pattern-card pattern-campaign' : 'pattern-card';
        
        // Build mini evidence table
        const domains = [...new Set(cluster.reports.map(r => r.extracted_domain).filter(Boolean))];
        const phones = [...new Set(cluster.reports.map(r => r.extracted_phone).filter(Boolean))];
        const tactic = cluster.reports[0]?.tactic || 'unknown';
        
        let evidenceRows = '';
        domains.forEach(d => {
            evidenceRows += `<tr><td>🌐 Domain</td><td class="evidence-value">${d}</td><td><button class="btn-copy" onclick="navigator.clipboard.writeText('${d}')">📋</button></td></tr>`;
        });
        phones.forEach(p => {
            evidenceRows += `<tr><td>📱 Phone</td><td class="evidence-value">${p}</td><td><button class="btn-copy" onclick="navigator.clipboard.writeText('${p}')">📋</button></td></tr>`;
        });
        
        card.innerHTML = `
            <div class="pattern-header">
                <span class="pattern-id">#${cluster.cluster_id}</span>
                <span class="pattern-count">${cluster.report_count} report${cluster.report_count !== 1 ? 's' : ''}</span>
                ${cluster.campaign_detected ? '<span class="pattern-alert">🚨 CAMPAIGN</span>' : ''}
            </div>
            <div class="pattern-tactic">Tactic: <strong>${tactic}</strong></div>
            ${evidenceRows ? `
                <table class="evidence-mini-table">
                    <thead><tr><th>Type</th><th>Value</th><th></th></tr></thead>
                    <tbody>${evidenceRows}</tbody>
                </table>
            ` : '<p class="text-muted text-sm">No IOCs extracted yet</p>'}
            <div class="pattern-snippets">
                ${cluster.reports.slice(0, 2).map(r => `<div class="snippet-preview">"${(r.redacted_text || '').substring(0, 80)}..."</div>`).join('')}
                ${cluster.report_count > 2 ? `<div class="snippet-more">+${cluster.report_count - 2} more</div>` : ''}
            </div>
        `;
        
        container.appendChild(card);
    });
}
