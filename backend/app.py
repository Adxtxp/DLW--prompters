from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware

# Ensure these match the function names in your logic.py
from logic import redact_text, detect_tactics_and_score, detect_campaigns, generate_authority_packet

app = FastAPI(title="DLW-Prompters API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalysisRequest(BaseModel):
    text: str

class ReportCreate(BaseModel):
    message: str
    type: str
    sender: Optional[str] = None
    risk_score: int
    risk_level: str
    tactics: List[str]

LIVE_REPORTS_DB = []

@app.get("/")
async def root():
    return {"message": "Backend is running successfully!"}

@app.post("/analyze")
async def analyze_data(request: AnalysisRequest):
    # 1. Redact text
    safe_text = redact_text(request.text)
    
    # 2. Call the Agentic Triage Expert
    analysis_results = detect_tactics_and_score(request.text)
    
    # 3. Find matching cluster from LIVE_REPORTS_DB (Phase 2.4)
    # This gives the frontend the authoritative similar-report count for THIS tactic
    clusters = detect_campaigns(LIVE_REPORTS_DB)
    tactic = analysis_results["tactic"]
    tactic_words = [w.strip() for w in tactic.lower().split("+") if w.strip() and len(w.strip()) > 2]
    
    cluster_info = {"report_count": 0, "campaign_detected": False, "cluster_id": None}
    for cluster in clusters:
        # Find the cluster whose stored reports share any tactic word with this analysis
        for report in cluster["reports"]:
            stored_tactic = (report.get("tactic") or "").lower()
            if any(tw in stored_tactic for tw in tactic_words):
                cluster_info = {
                    "report_count": cluster["report_count"],
                    "campaign_detected": cluster["campaign_detected"],
                    "cluster_id": cluster["cluster_id"]
                }
                break
        if cluster_info["cluster_id"] is not None:
            break
    
    # 4. Combine and return the payload
    return {
        "redacted_text": safe_text,
        "tactic": analysis_results["tactic"],
        "risk_score": analysis_results["risk_score"],
        "reasons": analysis_results["reasons"],
        "intervention_text": analysis_results["intervention_text"],
        "cluster_info": cluster_info
    }
class ScamReport(BaseModel):
    redacted_text: str
    tactic: str
    extracted_domain: Optional[str] = ""
    extracted_phone: Optional[str] = ""
    timestamp: str

# This is your live, in-memory database for the hackathon
LIVE_REPORTS_DB = []

@app.post("/report")
async def generate_report(report: ScamReport):
    # Convert to dictionary and assign an ID
    new_report = report.dict()
    new_report["id"] = len(LIVE_REPORTS_DB) + 1
    
    # Securely store ONLY the redacted/analyzed data
    LIVE_REPORTS_DB.append(new_report)
    
    return {"status": "success", "message": "Report saved securely.", "report_id": new_report["id"]}

@app.get("/reports")
async def get_all_reports():
    return {"reports": LIVE_REPORTS_DB}

@app.get("/clusters")
async def get_clusters():
    return {"clusters": detect_campaigns(LIVE_REPORTS_DB)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)