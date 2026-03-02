from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware

from logic import get_data_and_cluster, redact_text, detect_tactics_and_score, detect_campaigns, generate_authority_packet

app = FastAPI(title="DLW-Prompters API")

# --- CORS SETUP ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- API SCHEMAS ---
class AnalysisRequest(BaseModel):
    text: str
    metadata: Optional[dict] = None

class ClusterAdvisory(BaseModel):
    cluster_id: int
    advice: str

class ScamReport(BaseModel):
    redacted_text: str
    tactic: str
    extracted_domain: Optional[str] = ""
    extracted_phone: Optional[str] = ""
    timestamp: str

class ReportCreate(BaseModel):
    message: str
    type: str
    sender: Optional[str] = None
    risk_score: int
    risk_level: str
    tactics: List[str]

# --- DATABASE ---
# Your live, in-memory database for the hackathon
LIVE_REPORTS_DB = []


# --- ENDPOINTS ---

@app.get("/")
async def root():
    return {"message": "Backend is running successfully!", "framework": "FastAPI"}

@app.post("/analyze")
async def analyze_data(request: AnalysisRequest):
    # 1. Redact the text (Phase 2.1)
    safe_text = redact_text(request.text)
    
    # 2. Call the Agentic Triage Expert
    analysis_results = detect_tactics_and_score(request.text)
    
    # 3. Return the dynamic LLM payload
    return {
        "redacted_text": safe_text,
        "tactic": analysis_results.get("tactic", "Unknown"),
        "risk_score": analysis_results.get("risk_score", 50),
        "reasons": analysis_results.get("reasons", []),
        "user_emotion": analysis_results.get("user_emotion", "Unknown"), 
        "intervention_text": analysis_results.get("intervention_text", "Proceed with caution.")
    }

@app.post("/api/reports")
async def save_report(report: ReportCreate):
    try:
        new_report = {
            "id": len(LIVE_REPORTS_DB) + 1,
            "timestamp": datetime.now().isoformat(),
            "message_snippet": report.message[:100] + "..." if len(report.message) > 100 else report.message,
            "message_type": report.type,
            "risk_level": report.risk_level,
            "risk_score": report.risk_score,
            "tactics": report.tactics,
            "sender": report.sender or "Unknown"
        }
        
        LIVE_REPORTS_DB.append(new_report)
        return {"status": "success", "message": "Report saved to community database", "report_id": new_report["id"]}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/report")
async def generate_report(report: ScamReport):
    new_report = report.dict()
    new_report["id"] = len(LIVE_REPORTS_DB) + 1
    LIVE_REPORTS_DB.append(new_report)
    return {"status": "success", "message": "Report saved securely.", "report_id": new_report["id"]}

@app.get("/reports")
async def get_all_reports():
    return {"reports": LIVE_REPORTS_DB}

@app.post("/clusters/{cluster_id}/advisory")
async def post_advisory(cluster_id: int, advisory: ClusterAdvisory):
    return {"message": f"Advisory added to cluster {cluster_id}"}

@app.get("/clusters")
async def get_clusters():
    clusters = detect_campaigns(LIVE_REPORTS_DB)
    return {"clusters": clusters}

@app.get("/clusters/{cluster_id}/authority-packet")
async def get_authority_packet(cluster_id: int):
    clusters = detect_campaigns(LIVE_REPORTS_DB)
    for cluster in clusters:
        if cluster["cluster_id"] == cluster_id:
            return generate_authority_packet(cluster)
            
    return {"error": "Cluster not found"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)