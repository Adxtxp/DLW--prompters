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

@app.post("/report")
async def generate_report():
    return {"status": "report generated"}

@app.get("/reports")
async def get_all_reports():
    return {"reports": []}



@app.post("/clusters/{cluster_id}/advisory")
async def post_advisory(cluster_id: int, advisory: ClusterAdvisory):
    return {"message": f"Advisory added to cluster {cluster_id}"}



# Mock DB for testing Phase 2.4/2.5
MOCK_REPORTS_DB = [
    {"id": 1, "redacted_text": "URGENT: Your IRAS tax return failed. Call [REDACTED_PHONE].", "tactic": "urgency + authority", "extracted_domain": "fake-iras-tax.com", "extracted_phone": "+6591234567", "timestamp": "2026-03-02T10:00:00Z"},
    {"id": 2, "redacted_text": "IRAS Alert: Tax return failed. Contact us at [REDACTED_PHONE].", "tactic": "urgency + authority", "extracted_domain": "fake-iras-tax.com", "extracted_phone": "+6591234567", "timestamp": "2026-03-02T11:00:00Z"},
    {"id": 3, "redacted_text": "Failed tax return. Call immediately.", "tactic": "urgency", "extracted_domain": "", "extracted_phone": "+6591234567", "timestamp": "2026-03-02T12:00:00Z"},
    {"id": 4, "redacted_text": "Govt tax penalty notice. Pay via link.", "tactic": "fear + authority", "extracted_domain": "fake-iras-tax.com", "extracted_phone": "", "timestamp": "2026-03-02T13:00:00Z"},
    {"id": 5, "redacted_text": "Tax return error. Please resolve urgently.", "tactic": "urgency", "extracted_domain": "fake-iras-tax.com", "extracted_phone": "", "timestamp": "2026-03-02T14:00:00Z"}
]

@app.get("/clusters")
async def get_clusters():
    # Run the TF-IDF clustering logic
    clusters = detect_campaigns(MOCK_REPORTS_DB)
    return {"clusters": clusters}

@app.get("/clusters/{cluster_id}/authority-packet")
async def get_authority_packet(cluster_id: int):
    clusters = detect_campaigns(MOCK_REPORTS_DB)
    
    # Find the specific cluster
    for cluster in clusters:
        if cluster["cluster_id"] == cluster_id:
            packet = generate_authority_packet(cluster)
            return packet
            
    return {"error": "Cluster not found"}

if __name__ == "__main__":
    import uvicorn
    # FastAPI usually runs on port 8000 by default
    uvicorn.run(app, host="0.0.0.0", port=8000)