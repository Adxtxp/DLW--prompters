from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware

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
    return {"status": "success", "message": "Analysis started"}

@app.post("/report")
async def generate_report():
    return {"status": "report generated"}

@app.get("/reports")
async def get_all_reports():
    return {"reports": []}

@app.get("/clusters")
async def get_clusters():
    return {"clusters": []}

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