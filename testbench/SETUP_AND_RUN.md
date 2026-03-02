# 🧪 Sentinel Testbench: Evaluation Guide

Welcome to the Sentinel Testbench! This guide will walk you through evaluating our core innovation: **Community-Level Scam Campaign Detection**.

## 🎯 The Evaluation Goal
We want to demonstrate the leap from **Individual Protection** to **Community Intelligence**. You will see how an isolated threat is handled, and how >= 5 similar threats trigger a community-wide alarm.

---

## 🏃‍♂️ Step-by-Step Simulation

### Phase 1: The Individual Intervention (Cognitive Reset)
1. Ensure both the Backend and Frontend servers are running (see the main `README.md` for startup commands).
2. Open the UI at `http://localhost:8080`.
3. Open `sample_inputs/scam1.txt` from this testbench folder.
4. Copy the text and paste it into the UI's analysis box.
5. Click **"Analyze"**.
   * *Notice:* The system detects the psychological tactic (Authority + Fear) and generates a contextual "Cognitive Reset" warning to protect the user.
6. Click **"Submit to Community"** to log the anonymized report.

### Phase 2: Triggering the Community Alarm
Now, let's simulate this scam spreading across the community. 
1. Open `scam2.txt` through `scam5.txt` one by one. 
2. Paste each into the UI, click **"Analyze"**, and then **"Submit to Community"**.
3. *Behind the scenes:* The Community Intelligence Agent is using TF-IDF and cosine similarity to cluster these incoming reports.

### Phase 3: The Dashboard & Actionable Response
1. Navigate to the **Dashboard** page in the UI.
2. Because our system hit the >= 5 threshold for similar threats, you will see the status has flipped to **🚨 Active Campaign Detected**.
3. Click **"Download Authority Packet"**. 
   * *Result:* The system generates a structured JSON intelligence report containing the extracted malicious domains, phone numbers, and tactics, ready to be handed off to first responders or the cybercrime unit.

---
**Testing Note:** You can also test `benign1.txt` or `other_scam1.txt` to verify that the system correctly ignores normal messages and separates unrelated threats into different clusters.