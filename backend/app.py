from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
import requests
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# ── Clients ──────────────────────────────────────────────
gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
VIRUSTOTAL_API_KEY = os.getenv("VIRUSTOTAL_API_KEY")


# ── Helper: Analyze text with Gemini AI ──────────────────
def analyze_with_ai(text):
    prompt = f"""You are a scam and fraud detection assistant.
Analyze the following message, email, or URL for scam indicators.

Text to analyze:
\"\"\"{text}\"\"\"

Respond ONLY in this exact JSON format with no extra text:
{{
  "score": <number from 0 to 100>,
  "status": "<SAFE or SUSPICIOUS or SCAM>",
  "reason": "<one clear sentence explaining why>"
}}

Scoring guide:
- 0 to 30 = SAFE (normal everyday message)
- 31 to 69 = SUSPICIOUS (some red flags, be careful)
- 70 to 100 = SCAM (clear scam indicators detected)"""

    response = gemini_client.models.generate_content(model="gemini-1.5-flash", contents=prompt)

    import json
    raw = response.text.strip()
    # Strip markdown code block if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    result = json.loads(raw.strip())
    return result


# ── Helper: Check URL with VirusTotal ────────────────────
def check_url_virustotal(url):
    if not VIRUSTOTAL_API_KEY:
        return None

    headers = {"x-apikey": VIRUSTOTAL_API_KEY}

    # Submit URL for scanning
    response = requests.post(
        "https://www.virustotal.com/api/v3/urls",
        headers=headers,
        data={"url": url}
    )

    if response.status_code != 200:
        return None

    analysis_id = response.json()["data"]["id"]

    # Get scan result
    result = requests.get(
        f"https://www.virustotal.com/api/v3/analyses/{analysis_id}",
        headers=headers
    )

    if result.status_code != 200:
        return None

    stats = result.json()["data"]["attributes"]["stats"]
    malicious = stats.get("malicious", 0)
    suspicious = stats.get("suspicious", 0)

    return {
        "malicious": malicious,
        "suspicious": suspicious,
        "flagged": malicious > 0 or suspicious > 0
    }


# ── Helper: Detect if input contains a URL ───────────────
def extract_url(text):
    import re
    pattern = r'https?://[^\s]+'
    match = re.search(pattern, text)
    return match.group(0) if match else None


# ── Main Route: Analyze input ────────────────────────────
@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json()

    if not data or "text" not in data:
        return jsonify({"error": "Please provide text to analyze."}), 400

    text = data["text"].strip()

    if len(text) < 3:
        return jsonify({"error": "Input is too short to analyze."}), 400

    if len(text) > 5000:
        return jsonify({"error": "Input is too long. Max 5000 characters."}), 400

    try:
        # Step 1: AI analysis
        ai_result = analyze_with_ai(text)

        # Step 2: URL scan (if URL is found in the text)
        url_result = None
        detected_url = extract_url(text)
        if detected_url:
            url_result = check_url_virustotal(detected_url)

        # Step 3: Boost score if VirusTotal flagged the URL
        if url_result and url_result["flagged"]:
            ai_result["score"] = min(100, ai_result["score"] + 20)
            if ai_result["score"] >= 70:
                ai_result["status"] = "SCAM"
            ai_result["reason"] += " URL was also flagged by VirusTotal security scan."

        return jsonify({
            "score": ai_result["score"],
            "status": ai_result["status"],
            "reason": ai_result["reason"],
            "url_scanned": detected_url,
            "url_flagged": url_result["flagged"] if url_result else None
        })

    except Exception as e:
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500


# ── Health Check Route ───────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "Backend is running!"})


# ── Run Server ───────────────────────────────────────────
if __name__ == "__main__":
    app.run(debug=True, port=5000)
