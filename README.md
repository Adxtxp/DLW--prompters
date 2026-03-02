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

To test Sentinel on your local machine, you will need to open **TWO separate terminal windows** to start both the AI engine (backend) and the user interface (frontend).

### Terminal 1: Start the Backend AI Engine
Open your first terminal, activate your virtual environment, and run:
```bash
cd backend
pip install -r requirements.txt
uvicorn app:app --reload
```
*⚠️ Note: The terminal will display a link (e.g., `http://127.0.0.1:8000`). **Do not click this link.** This is the raw data engine, not the user interface.*

### Terminal 2: Start the Frontend UI
Open a **second, new terminal window**, navigate to the frontend folder, and launch the local web server:
```bash
cd frontend
python -m http.server 8080
```

### 🖥️ View the Application
Once both terminals are running, **open your web browser** (Chrome, Edge, Safari) and manually type this exact address into the URL bar:
**`http://localhost:8080`**

From there, you will see the Sentinel dashboard and can begin using the testbench files!

---

## 🧪 Demo & Testbench

We have prepared a simulated threat feed so you can experience Sentinel's community clustering in action. 

Please navigate to the `testbench/` directory and read `SETUP_AND_RUN.md` for exact instructions on how to trigger the **Campaign Detected** moment using our sample phishing data.

---

## ⚖️ Responsible AI & Privacy-by-Design

Because public safety tools must protect user trust, Sentinel is built with strict privacy constraints:
* **Zero-Raw Storage:** All messages pass through a strict Regex-based redaction function before processing. Emails, phone numbers, and identifying sequences are stripped out.
* **Metadata Only:** The database only stores anonymized psychological indicators, timestamps, and extracted malicious domains. No personal communications are ever saved.