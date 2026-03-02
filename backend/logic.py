import pandas as pd
from sklearn.cluster import KMeans

import re
import pandas as pd
# We will swap KMeans for TF-IDF later in Phase 2.4
from sklearn.cluster import KMeans 

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

def redact_text(raw_text: str) -> str:
    """
    Phase 2.1: Redacts PII for Responsible AI compliance.
    Never stores the raw message.
    """
    if not raw_text:
        return ""
        
    # 1. Mask Emails (e.g., target@email.com -> [REDACTED_EMAIL])
    text = re.sub(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', '[REDACTED_EMAIL]', raw_text)
    
    # 2. Mask Phone Numbers (Basic international and local formats)
    text = re.sub(r'\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}', '[REDACTED_PHONE]', text)
    
    # 3. Mask Long Numeric Sequences (e.g., Bank Accounts, NRICs - targets 5+ digits)
    text = re.sub(r'\b\d{5,}\b', '[REDACTED_NUMBER]', text)
    
    return text

def get_data_and_cluster(file_path: str, n_clusters: int = 2):
    """
    Reads prompt data from a CSV and applies KMeans clustering.
    """
    try:
        # Load the data Erin will be managing
        df = pd.read_csv(file_path)
        
        # Select only the numerical features for KMeans
        X = df[['feature_1', 'feature_2']]
        
        # Initialize and run the KMeans model with the correct parameter
        model = KMeans(n_clusters=n_clusters, n_init='auto', random_state=42)
        df['cluster'] = model.fit_predict(X)
        
        # Convert the DataFrame back to a list of dictionaries for the API
        return df.to_dict(orient='records')
        
    except FileNotFoundError:
        # Prevents the server from crashing if the CSV is missing
        return [{"error": f"Dataset not found at {file_path}. Please check the data folder."}]
    except Exception as e:
        return [{"error": f"Failed to process data: {str(e)}"}]

def detect_tactics_and_score(text: str):
    """
    Phases 2.2 & 2.3: Rule-based tactic detection and weighted risk scoring.
    """
    text_lower = text.lower()
    tactics = []
    reasons = []
    risk_score = 0
    
    # Define our keyword dictionaries
    keyword_rules = {
        "urgency": {
            "words": ["urgent", "immediately", "action required", "deadline", "now"],
            "score": 15,
            "reason": "Contains urgent deadline language"
        },
        "authority": {
            "words": ["iras", "police", "tax", "government", "bank", "court"],
            "score": 15,
            "reason": "Claims to be an authority figure or agency"
        },
        "fear": {
            "words": ["failed", "arrest", "penalty", "jail", "suspend", "warrant"],
            "score": 20,
            "reason": "Uses fear-inducing or threatening language"
        }
    }
    
    # Scan the text for keywords
    for tactic, rule in keyword_rules.items():
        if any(keyword in text_lower for keyword in rule["words"]):
            tactics.append(tactic)
            reasons.append(rule["reason"])
            risk_score += rule["score"]
            
    # Add scoring for URLs or OTP requests (as per your rubric)
    if "http" in text_lower or ".com" in text_lower:
        risk_score += 20
        reasons.append("Contains a suspicious URL or domain")
        
    if "otp" in text_lower or "password" in text_lower:
        risk_score += 30
        reasons.append("Requests sensitive credentials (OTP/Password)")
        
    # Cap score at 100
    risk_score = min(risk_score, 100)
    
    # Format the final tactic string (e.g., "authority + urgency")
    final_tactic = " + ".join(tactics) if tactics else "none"
    
    return {
        "tactic": final_tactic,
        "risk_score": risk_score,
        "reasons": reasons,
        "intervention_text": "Pause and verify this request through official channels." if risk_score > 50 else "Seems safe, but remain cautious."
    }  

def detect_campaigns(reports: list):
    """
    Phase 2.4: Core Public Safety Layer using TF-IDF and Cosine Similarity.
    """
    if not reports:
        return []

    # 1. TF-IDF Vectorization
    texts = [r.get("redacted_text", "") for r in reports]
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(texts)
    
    # 2. Cosine Similarity Matrix
    cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)

    clusters = []
    visited = set()

    for i in range(len(reports)):
        if i in visited:
            continue

        current_cluster = [reports[i]]
        visited.add(i)

        for j in range(i + 1, len(reports)):
            if j in visited:
                continue

            r1, r2 = reports[i], reports[j]
            
            # 3. Clustering Logic (Domain OR Phone OR Similarity > 0.75)
            same_domain = r1.get("extracted_domain") and r1.get("extracted_domain") == r2.get("extracted_domain")
            same_phone = r1.get("extracted_phone") and r1.get("extracted_phone") == r2.get("extracted_phone")
            high_sim = cosine_sim[i][j] > 0.75

            if same_domain or same_phone or high_sim:
                current_cluster.append(r2)
                visited.add(j)

        # 4. Campaign Detection Trigger (≥ 5 reports)
        is_campaign = len(current_cluster) >= 5
        
        clusters.append({
            "cluster_id": len(clusters) + 1,
            "report_count": len(current_cluster),
            "campaign_detected": is_campaign,
            "reports": current_cluster
        })

    return clusters

def generate_authority_packet(cluster: dict):
    """
    Phase 2.5: Authority Packet Generator returning structured JSON.
    """
    # Extract unique indicators
    domains = list(set([r.get("extracted_domain") for r in cluster["reports"] if r.get("extracted_domain")]))
    phones = list(set([r.get("extracted_phone") for r in cluster["reports"] if r.get("extracted_phone")]))
    
    # Grab the primary tactic (simplification: grab the first report's tactic)
    tactic = cluster["reports"][0].get("tactic", "unknown") if cluster["reports"] else "unknown"

    return {
        "cluster_id": cluster["cluster_id"],
        "report_count": cluster["report_count"],
        "tactic": tactic,
        "indicators": {
            "domains": domains,
            "phones": phones
        },
        "time_window": "Last 48 hours",
        "recommendation": "Issue advisory and report to cybercrime unit." if cluster["campaign_detected"] else "Monitor for further activity."
    } 