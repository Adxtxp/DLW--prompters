from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware


from logic import get_data_and_cluster, redact_text, detect_tactics_and_score



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

# UPDATED: Phase 2 - Connecting to the real CSV dataset
@app.get("/clusters")
async def get_clusters():
    # Point directly to the CSV in the data folder
    data_path = "data/prompter_dataset.csv"
    
    # Run the scikit-learn clustering model
    results = get_data_and_cluster(data_path)
    return {"clusters": results}

@app.post("/clusters/{cluster_id}/advisory")
async def post_advisory(cluster_id: int, advisory: ClusterAdvisory):
    return {"message": f"Advisory added to cluster {cluster_id}"}

@app.get("/clusters/{cluster_id}/authority-packet")
async def get_authority_packet(cluster_id: int):
    return {"cluster_id": cluster_id, "packet": "download_link_placeholder"}



if __name__ == "__main__":
    import uvicorn
    # FastAPI usually runs on port 8000 by default
    uvicorn.run(app, host="0.0.0.0", port=8000)