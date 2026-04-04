from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
import requests
import os
import re
import json
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# ── Clients ──────────────────────────────────────────────
gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
VIRUSTOTAL_API_KEY = os.getenv("VIRUSTOTAL_API_KEY")
NUMVERIFY_API_KEY = os.getenv("NUMVERIFY_API_KEY")


# ── Helper: Analyze text with Gemini AI ──────────────────
def analyze_with_ai(text):
    prompt = f"""You are a scam and fraud detection assistant.

The user has submitted the following input for you to analyze:
\"\"\"{text}\"\"\"

Your job is to extract the actual content being referred to (a phone number, URL, message, job offer, IP address, etc.) and analyze THAT for scam indicators.

Important rules:
- Ignore spelling or grammar errors made by the person submitting the input — they may just be typing quickly.
- Focus only on whether the content itself (the number, link, message, job offer) shows signs of being a scam.
- A phone number alone is not a scam unless there is other suspicious context.
- A job offer with unrealistic pay, vague details, or requests for personal info upfront is a scam.
- Phishing links, fake prizes, urgent money requests, and impersonation are scam indicators.

Respond ONLY in this exact JSON format with no extra text:
{{
  "score": <number from 0 to 100>,
  "status": "<SAFE or SUSPICIOUS or SCAM>",
  "reason": "<one clear sentence explaining the verdict based on the actual content, not the user's wording>"
}}

Scoring guide:
- 0 to 30 = SAFE
- 31 to 69 = SUSPICIOUS
- 70 to 100 = SCAM"""

    response = gemini_client.models.generate_content(model="models/gemini-2.5-flash", contents=prompt)

    raw = response.text.strip()
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

    response = requests.post(
        "https://www.virustotal.com/api/v3/urls",
        headers=headers,
        data={"url": url}
    )

    if response.status_code != 200:
        return None

    analysis_id = response.json()["data"]["id"]

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


# ── Helper: Check IP with VirusTotal ─────────────────────
def check_ip_virustotal(ip):
    if not VIRUSTOTAL_API_KEY:
        return None

    headers = {"x-apikey": VIRUSTOTAL_API_KEY}
    result = requests.get(
        f"https://www.virustotal.com/api/v3/ip_addresses/{ip}",
        headers=headers
    )

    if result.status_code != 200:
        return None

    stats = result.json()["data"]["attributes"]["last_analysis_stats"]
    malicious = stats.get("malicious", 0)
    suspicious = stats.get("suspicious", 0)

    return {
        "malicious": malicious,
        "suspicious": suspicious,
        "flagged": malicious > 0 or suspicious > 0
    }


# ── Helper: Check phone number with NumVerify ─────────────
def check_phone_numverify(phone):
    if not NUMVERIFY_API_KEY:
        return None

    response = requests.get(
        "http://apilayer.net/api/validate",
        params={
            "access_key": NUMVERIFY_API_KEY,
            "number": phone,
            "format": 1
        }
    )

    if response.status_code != 200:
        return None

    data = response.json()

    if not data.get("valid"):
        return {"valid": False, "flagged": False, "info": "Invalid phone number"}

    return {
        "valid": True,
        "flagged": False,
        "country": data.get("country_name", "Unknown"),
        "carrier": data.get("carrier", "Unknown"),
        "line_type": data.get("line_type", "Unknown"),
        "info": f"{data.get('country_name', '')} · {data.get('carrier', '')} · {data.get('line_type', '')}"
    }


# ── Helper: Extract URL ───────────────────────────────────
def extract_url(text):
    pattern = r'https?://[^\s]+'
    match = re.search(pattern, text)
    return match.group(0) if match else None


# ── Helper: Extract IP address ────────────────────────────
def extract_ip(text):
    pattern = r'\b(?:\d{1,3}\.){3}\d{1,3}\b'
    match = re.search(pattern, text)
    return match.group(0) if match else None


# ── Helper: Extract phone number ──────────────────────────
def extract_phone(text):
    pattern = r'(\+?[\d\s\-\(\)]{7,15})'
    matches = re.findall(pattern, text)
    for match in matches:
        digits = re.sub(r'\D', '', match)
        if 7 <= len(digits) <= 15:
            return match.strip()
    return None


# ── Helper: Analyze image with Gemini Vision ─────────────
def analyze_image_with_ai(image_base64, mime_type):
    import base64
    from google.genai import types

    prompt = """You are a scam and fraud detection assistant.
Analyze this screenshot for any scam indicators — suspicious messages, phishing links, fake offers, urgent requests, or fraud.

Respond ONLY in this exact JSON format with no extra text:
{
  "score": <number from 0 to 100>,
  "status": "<SAFE or SUSPICIOUS or SCAM>",
  "reason": "<one clear sentence explaining why>"
}

Scoring guide:
- 0 to 30 = SAFE
- 31 to 69 = SUSPICIOUS
- 70 to 100 = SCAM"""

    image_bytes = base64.b64decode(image_base64)

    response = gemini_client.models.generate_content(
        model="models/gemini-2.5-flash",
        contents=[
            types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
            prompt
        ]
    )

    raw = response.text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())


# ── Main Route: Analyze input ────────────────────────────
@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json()

    if not data:
        return jsonify({"error": "Please provide text or image to analyze."}), 400

    # Image analysis
    if "image" in data:
        try:
            ai_result = analyze_image_with_ai(data["image"], data.get("mime_type", "image/jpeg"))
            return jsonify({
                "score": ai_result["score"],
                "status": ai_result["status"],
                "reason": ai_result["reason"],
                "url_scanned": None,
                "url_flagged": None,
                "ip_scanned": None,
                "ip_flagged": None,
                "phone_scanned": None,
                "phone_info": None,
                "phone_valid": None
            })
        except Exception as e:
            return jsonify({"error": f"Image analysis failed: {str(e)}"}), 500

    if "text" not in data:
        return jsonify({"error": "Please provide text to analyze."}), 400

    text = data["text"].strip()

    if len(text) < 3:
        return jsonify({"error": "Input is too short to analyze."}), 400

    if len(text) > 5000:
        return jsonify({"error": "Input is too long. Max 5000 characters."}), 400

    try:
        # Step 1: AI analysis
        ai_result = analyze_with_ai(text)

        # Step 2: URL scan
        url_result = None
        detected_url = extract_url(text)
        if detected_url:
            url_result = check_url_virustotal(detected_url)

        # Step 3: IP scan
        ip_result = None
        detected_ip = None
        if not detected_url:
            detected_ip = extract_ip(text)
            if detected_ip:
                ip_result = check_ip_virustotal(detected_ip)

        # Step 4: Phone check
        phone_result = None
        detected_phone = None
        if not detected_url and not detected_ip:
            detected_phone = extract_phone(text)
            if detected_phone:
                phone_result = check_phone_numverify(detected_phone)

        # Step 5: Boost score if flagged
        if url_result and url_result["flagged"]:
            ai_result["score"] = min(100, ai_result["score"] + 20)
            if ai_result["score"] >= 70:
                ai_result["status"] = "SCAM"
            ai_result["reason"] += " URL was also flagged by VirusTotal."

        if ip_result and ip_result["flagged"]:
            ai_result["score"] = min(100, ai_result["score"] + 20)
            if ai_result["score"] >= 70:
                ai_result["status"] = "SCAM"
            ai_result["reason"] += " IP address was flagged by VirusTotal."

        return jsonify({
            "score": ai_result["score"],
            "status": ai_result["status"],
            "reason": ai_result["reason"],
            "url_scanned": detected_url,
            "url_flagged": url_result["flagged"] if url_result else None,
            "ip_scanned": detected_ip,
            "ip_flagged": ip_result["flagged"] if ip_result else None,
            "phone_scanned": detected_phone,
            "phone_info": phone_result["info"] if phone_result else None,
            "phone_valid": phone_result["valid"] if phone_result else None
        })

    except Exception as e:
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500


# ── Health Check Route ───────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "Backend is running!"})


# ── Run Server ───────────────────────────────────────────
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
