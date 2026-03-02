from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware



from logic import get_data_and_cluster, redact_text, detect_tactics_and_score, detect_campaigns, generate_authority_packet



app = FastAPI(title="DLW-Prompters API")

# --- CORS SETUP ---
# This allows Isaac's frontend to communicate with your backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- API SCHEMAS (The "Contract" for Isaac) ---
class AnalysisRequest(BaseModel):
    text: str
    metadata: Optional[dict] = None

class ClusterAdvisory(BaseModel):
    cluster_id: int
    advice: str

# --- ENDPOINTS ---

@app.get("/")
async def root():
    return {"message": "Backend is running successfully!", "framework": "FastAPI"}

@app.post("/analyze")
async def analyze_data(request: AnalysisRequest):
    # 1. Redact the text (Phase 2.1)
    safe_text = redact_text(request.text)
    
    # 2. Detect tactics and calculate score (Phase 2.2 & 2.3)
    # Note: We analyze the ORIGINAL text to catch keywords before they get masked out
    analysis_results = detect_tactics_and_score(request.text)
    
    # 3. Combine and return the payload matching your rubric
    return {
        "redacted_text": safe_text,
        "tactic": analysis_results["tactic"],
        "risk_score": analysis_results["risk_score"],
        "reasons": analysis_results["reasons"],
        "intervention_text": analysis_results["intervention_text"]
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



@app.post("/clusters/{cluster_id}/advisory")
async def post_advisory(cluster_id: int, advisory: ClusterAdvisory):
    return {"message": f"Advisory added to cluster {cluster_id}"}



@app.get("/clusters")
async def get_clusters():
    # Run the TF-IDF clustering logic on the LIVE data
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
    # FastAPI usually runs on port 8000 by default
    uvicorn.run(app, host="0.0.0.0", port=8000)