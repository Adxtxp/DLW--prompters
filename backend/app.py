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
    
    # 3. Return the expanded payload (Fixed syntax)
    return {
        "redacted_text": safe_text,
        "tactic": analysis_results.get("tactic", "Unknown"),
        "risk_score": analysis_results.get("risk_score", 50),
        "reasons": analysis_results.get("reasons", []),
        "user_emotion": analysis_results.get("user_emotion", "Unknown"), 
        "intervention_text": analysis_results.get("intervention_text", "Caution required."),
        "extracted_links": analysis_results.get("suspicious_links", []),
        "extracted_phones": analysis_results.get("phone_numbers", []),
        "call_to_action": analysis_results.get("call_to_action", "None detected.")
    }

@app.post("/api/reports")
async def save_report(report: ReportCreate):
    try:
        new_report = {
            "id": len(LIVE_REPORTS_DB) + 1,
            "timestamp": datetime.now().isoformat(),
            "message_snippet": report.message[:100],
            "message_type": report.type,
            "risk_level": report.risk_level,
            "risk_score": report.risk_score,
            "tactics": report.tactics,
            "sender": report.sender or "Unknown"
        }
        LIVE_REPORTS_DB.append(new_report)
        return {"status": "success", "report_id": new_report["id"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/reports")
async def get_all_reports():
    return {"reports": LIVE_REPORTS_DB}

@app.get("/clusters")
async def get_clusters():
    return {"clusters": detect_campaigns(LIVE_REPORTS_DB)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)