import re
import os
import json
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans 
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from openai import OpenAI

# Initialize OpenAI Client (Reads from the $env:OPENAI_API_KEY you set)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def redact_text(raw_text: str) -> str:
    """Phase 2.1: Redacts PII for Responsible AI compliance."""
    if not raw_text: return ""
    text = re.sub(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', '[REDACTED_EMAIL]', raw_text)
    text = re.sub(r'\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}', '[REDACTED_PHONE]', text)
    text = re.sub(r'\b\d{5,}\b', '[REDACTED_NUMBER]', text)
    return text

def detect_tactics_and_score(text: str):
    """
    Phases 2.2 & 2.3: Agentic Triage & Forensic Extraction.
    Uses LLM for psychological profiling with a rule-based fallback.
    """
    # --- STEP 1: ATTEMPT AGENTIC ANALYSIS (OpenAI) ---
    if os.getenv("OPENAI_API_KEY"):
        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo-0125", # High speed for real-time triage
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": (
                        "You are a Forensic Scam Analyst. Analyze the message and return JSON with: "
                        "'tactic' (string), 'risk_score' (int 0-100), 'reasons' (array), "
                        "'user_emotion' (the psychological trigger being exploited), "
                        "'intervention_text' (a cognitive reset coaching phrase), "
                        "'suspicious_links' (array of URLs found), "
                        "'phone_numbers' (array of phone numbers found), "
                        "'call_to_action' (the specific instruction given)."
                    )},
                    {"role": "user", "content": f"Analyze this suspicious message: {text}"}
                ]
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"Agentic Triage failed, falling back: {e}")

    # --- STEP 2: FALLBACK RULE-BASED LOGIC (If AI fails/no key) ---
    text_lower = text.lower()
    tactics, reasons = [], []
    risk_score = 0
    
    rules = {
        "urgency": {"words": ["urgent", "immediately", "deadline"], "score": 20, "r": "Urgent deadline language"},
        "authority": {"words": ["iras", "police", "bank", "singpass"], "score": 25, "r": "Claims authority agency"},
        "fear": {"words": ["arrest", "penalty", "jail", "suspend"], "score": 30, "r": "Uses threatening language"}
    }
    
    for tactic, rule in rules.items():
        if any(w in text_lower for w in rule["words"]):
            tactics.append(tactic)
            reasons.append(rule["r"])
            risk_score += rule["score"]

    if "http" in text_lower or ".com" in text_lower:
        risk_score += 20
        reasons.append("Contains suspicious link")

    return {
        "tactic": " + ".join(tactics) if tactics else "Unknown Manipulation",
        "risk_score": min(risk_score, 100),
        "reasons": reasons,
        "user_emotion": "Anxious / Pressured (Fallback Mode)",
        "intervention_text": "Pause. This message uses common scam tactics to rush you.",
        "suspicious_links": re.findall(r'(https?://\S+)', text),
        "phone_numbers": re.findall(r'\+?\d{8,}', text),
        "call_to_action": "The message attempts to make you click a link or provide info."
    }

# --- REMAINING FUNCTIONS (Erin's Clustering & Authority Packets) ---

def detect_campaigns(reports: list):
    """
    Phase 2.4: Core Public Safety Layer with Dynamic Narratives.
    Triggers 'Serious' status at 4 and 'Authority Escalation' at 5.
    """
    if not reports:
        return []

    texts = [r.get("redacted_text", "") for r in reports]
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(texts)
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
            if cosine_sim[i][j] > 0.75:
                current_cluster.append(reports[j])
                visited.add(j)

        count = len(current_cluster)
        
        # --- DYNAMIC NARRATIVE LOGIC ---
        if count >= 5:
            status = "CRITICAL"
            narrative = "🚨 Campaign Verified: Alerting authorities via generated report."
            color = "red"
        elif count == 4:
            status = "SERIOUS"
            narrative = "⚠️ Serious Threat: Multiple community matches detected."
            color = "orange"
        elif count > 1:
            status = "EMERGING"
            narrative = f"🔍 Emerging Pattern: {count} similar reports detected."
            color = "yellow"
        else:
            status = "ISOLATED"
            narrative = "✅ First report of this type. Monitoring for patterns."
            color = "green"

        clusters.append({
            "cluster_id": len(clusters) + 1,
            "report_count": count,
            "campaign_detected": count >= 5,
            "status": status,
            "narrative": narrative,
            "ui_color": color,
            "reports": current_cluster
        })

    return clusters
     

def generate_authority_packet(cluster: dict):
    """Phase 2.5: Authority Packet Generator returning structured JSON."""
    return {
        "cluster_id": cluster["cluster_id"],
        "report_count": cluster["report_count"],
        "indicators": {
            "links": list(set([r.get("extracted_domain") for r in cluster["reports"] if r.get("extracted_domain")])),
            "phones": list(set([r.get("extracted_phone") for r in cluster["reports"] if r.get("extracted_phone")]))
        },
        "recommendation": "ESCALATE: High-frequency campaign detected." if cluster["campaign_detected"] else "Monitor."
    }