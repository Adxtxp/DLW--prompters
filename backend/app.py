from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware

from logic import get_data_and_cluster, redact_text



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
    # Pass the incoming text through your new Phase 2.1 function
    safe_text = redact_text(request.text)
    
    return {
        "status": "success", 
        "original_length": len(request.text),
        "redacted_text": safe_text
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

@app.post("/analyze")
async def analyze_data(request: AnalysisRequest):
    # Pass the incoming text through your new Phase 2.1 function
    safe_text = redact_text(request.text)
    
    return {
        "status": "success", 
        "original_length": len(request.text),
        "redacted_text": safe_text
    }

if __name__ == "__main__":
    import uvicorn
    # FastAPI usually runs on port 8000 by default
    uvicorn.run(app, host="0.0.0.0", port=8000)