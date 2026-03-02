# DLW--prompters
# 🛡️ Sentinel: Human-Centric Scam Early Warning Network

**Sentinel** is a psychology-aware, community-level threat intelligence system that detects digital manipulation, intervenes to protect vulnerable users, and coordinates public safety responses across communities.

---

## 🚨 The Problem & The Gap

Public safety is no longer just physical; digital scams cause massive financial loss and emotional distress, often targeting vulnerable populations like the elderly or students. 

**The Gap in Current Solutions:**
Existing anti-phishing tools (like basic spam filters or ScamShield) operate strictly as **technical gatekeepers**. 
* **They are reactive:** Relying on known blacklisted URLs or numbers.
* **They ignore the human element:** Failing to address *why* people fall for scams (psychological triggers like Fear, Authority, Urgency, or Reward).
* **They isolate the target:** Treating 50 identical attacks in a single community as 50 isolated incidents, completely missing the broader threat landscape.

## 💡 Our Solution

Sentinel shifts the paradigm from individual spam filtering to **community-wide situational awareness**. Think of it as a decentralized Security Operations Center (SOC) for everyday public safety. 

Instead of just silently blocking a message, Sentinel:
1. **Analyzes the Intent:** Detects the psychological manipulation tactic used.
2. **Executes a Cognitive Reset:** Intervenes with contextual warnings that break the psychological "spell" for the user.
3. **Aggregates Threat Intelligence:** Clusters anonymized reports across the community to detect spreading campaigns in real-time.

---

## 🏗️ Architecture & Agentic Workflow

Sentinel is powered by a multi-agent AI pipeline designed to turn raw, noisy signals into actionable intelligence.

* **Intake Agent:** Extracts text and metadata while aggressively redacting Personally Identifiable Information (PII).
* **Psychology Agent:** Uses NLP to detect underlying manipulation patterns (Fear, Authority, Urgency, Reward).
* **Risk Scoring Agent:** Assigns a confidence level based on extracted indicators (URLs, urgent language, OTP requests).
* **Intervention Agent:** Generates a tailored, easy-to-understand "cognitive reset" pop-up for the user.
* **Community Intelligence Agent (The Core):** Uses TF-IDF vectorization and cosine similarity to cluster reports. **If >= 5 similar reports are detected, the system escalates the threat status to "Active Campaign."**

---

## 🚀 Quickstart: How to Run Locally

To test Sentinel on your local machine, you will need to start both the Python backend and the web frontend.

### 1. Start the Backend (FastAPI)
Open your terminal, ensure your virtual environment is activated, and run:
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload