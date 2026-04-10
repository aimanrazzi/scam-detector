# Project Documentation

**Project Title:** Combat. — AI-Powered Scam Detector
**Date:** April 2026

---

## 1. Basic Information

| Field | Details |
|---|---|
| Project Title | Combat. — AI-Powered Scam & Fraud Detection App |
| Category | AI / Mobile Application |
| Platform | Android (APK) + iOS (Expo Go) |
| Backend | Python Flask, deployed on Render |
| Repository | https://github.com/aimanrazzi/scam-detector |

---

## 2. Problem Statement

### What problem are we solving?

Malaysia is one of the most scam-affected countries in Southeast Asia. In 2023, Malaysians lost over **RM2.6 billion** to scams. Common scam types include:

- **Macau Scams** — impersonating police, SPRM, or customs officers
- **Fake Job Offers** — unrealistic salaries, work-from-home with upfront fees
- **Investment Scams** — guaranteed returns on crypto, forex, or gold schemes
- **Parcel/Courier Scams** — fake Pos Laju / J&T notifications with phishing links
- **Love/Romance Scams** — fake overseas relationships leading to money transfers
- **Bank Impersonation** — fake Maybank, CIMB, RHB alerts asking for credentials

### Why it matters

Most people encounter suspicious messages, unknown phone numbers, or unusual links and have no quick way to verify them. Existing resources (like PDRM's Semak Mule) require manual searching. There is no unified, AI-powered tool that checks everything in one place and returns a clear verdict in seconds.

### Target users

- General Malaysian public, especially elderly and less tech-savvy users
- People who receive suspicious WhatsApp messages, phone calls, or emails
- Users who want to verify a profile photo before trusting someone online
- Anyone who receives a QR code from an unknown source

---

## 3. Solution Overview

### What we built

**Combat.** is a mobile application that lets users check any suspicious input — a message, phone number, URL, email, bank account, screenshot, profile photo, or QR code — and returns an instant AI-powered risk verdict with a score and explanation.

### Key features

| Feature | Description |
|---|---|
| Text Analysis | Paste any suspicious text — phone, URL, message, bank account, email, social handle |
| Screenshot Analysis | Upload or photograph a suspicious message for AI vision analysis |
| QR Code Scanner | Scan a QR code to check the embedded URL |
| Profile Checker | Detect AI-generated photos, stock photos, or public figure impersonation |
| Scan History | All scans saved to cloud (Firebase) or locally — filterable by status and date |
| Community Reports | Users flag confirmed scams; community warning shown on repeat scans |
| Multi-language | English, Bahasa Malaysia, Chinese (Simplified), Tamil |
| Dark / Light Theme | Full theme toggle across all screens |

### How it solves the problem

Instead of manually checking Semak Mule, searching VirusTotal, and googling a phone number separately, Combat. does all of this automatically in one tap. The app cross-references:

1. AI analysis (Malaysian scam pattern recognition)
2. PDRM Semak Mule (official government scam registry)
3. VirusTotal (URL and IP threat database)
4. NumVerify (phone number validation)
5. SerpAPI (social handle scam search)
6. Community reports (crowdsourced warnings)

The result is a single clear verdict: **SAFE / SUSPICIOUS / SCAM** with a score and explanation in the user's language.

---

## 4. Technical Approach

### AI / ML Models Used

| Task | Model | Provider |
|---|---|---|
| Text scam analysis | `llama-3.3-70b-versatile` | Groq |
| Image / screenshot analysis | `meta-llama/llama-4-scout-17b-16e-instruct` | Groq |
| Profile photo analysis | `meta-llama/llama-4-scout-17b-16e-instruct` | Groq |

**Why Groq?**
Groq's inference hardware delivers sub-second response times on large language models. For a real-time scam detection app where users expect instant results, this is critical. The free tier is also generous enough for a hackathon prototype.

### Tools & Frameworks

| Tool | Purpose |
|---|---|
| React Native + Expo SDK 54 | Cross-platform mobile app (Android + iOS) |
| Python Flask | REST API backend |
| Firebase Firestore | Cloud database for scan history and community reports |
| Firebase Authentication | User accounts (email/password + Google Sign-In) |
| EAS Build | Compiling the Android APK |
| EAS Update | Over-the-air JS bundle updates (no re-install needed) |
| Flask-Limiter | API rate limiting |
| firebase-admin | Server-side Firebase token verification |
| Gunicorn | Production WSGI server |
| Render | Backend cloud hosting |

### Data Used

| Source | Type | Used For |
|---|---|---|
| PDRM Semak Mule API | Live government API | Phone, bank account, email scam registry |
| VirusTotal API | Live threat intelligence API | URL and IP reputation check |
| NumVerify API | Live API | Phone number carrier and country validation |
| SerpAPI | Live Google Search API | Social handle scam mention search |
| User community reports | Crowdsourced (Firestore) | Community warning counts |

---

## 5. System Architecture

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    MOBILE APP (React Native)                │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Home    │  │   QR     │  │ Profile  │  │ History  │   │
│  │  Screen  │  │  Scanner │  │ Checker  │  │ Screen   │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │              │              │              │         │
│       └──────────────┴──────────────┘              │         │
│                      │                              │         │
│              securePost() — Bearer Token           │         │
│                      │                    Firebase  │         │
│                      │                    Firestore │         │
└──────────────────────┼─────────────────────────────┼─────────┘
                       │                             │
              HTTPS    │                             │ SDK
                       ▼                             ▼
┌──────────────────────────────┐      ┌──────────────────────────┐
│  FLASK BACKEND (Render)      │      │  FIREBASE (Google)       │
│                              │      │                          │
│  ┌────────────────────────┐  │      │  ┌────────────────────┐  │
│  │ Firebase Token Verify  │  │      │  │  Authentication    │  │
│  │ Rate Limiter           │  │      │  │  (email + Google)  │  │
│  └────────────────────────┘  │      │  └────────────────────┘  │
│                              │      │  ┌────────────────────┐  │
│  ┌────────────────────────┐  │      │  │  Firestore DB      │  │
│  │  Groq AI               │  │      │  │  - Scan history    │  │
│  │  (Text + Vision)       │  │      │  │  - Reports         │  │
│  └────────────────────────┘  │      │  └────────────────────┘  │
│                              │      └──────────────────────────┘
│  ┌────────────────────────┐  │
│  │  External APIs         │  │
│  │  - Semak Mule (PDRM)   │  │
│  │  - VirusTotal          │  │
│  │  - NumVerify           │  │
│  │  - SerpAPI             │  │
│  │  - ImgBB               │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

### Data Flow

1. User inputs text, image, or QR code in the app
2. App attaches a Firebase ID token to the request (Bearer auth)
3. Flask backend verifies the token, checks rate limits
4. Backend runs Groq AI analysis → external API checks → computes final score
5. Score, status, reason, and findings returned to app in JSON
6. App displays result and saves to Firebase Firestore (or AsyncStorage if guest)
7. On repeat scans of the same input, community report count is fetched from Firestore and displayed alongside the AI result

---

## 6. Implementation Details

### Modules & Components

**Frontend (`frontend/screens/`)**

| Screen | Purpose |
|---|---|
| `HomeScreen.js` | Main scan screen — text input + image upload |
| `QRScreen.js` | QR code scanner using device camera |
| `ProfileCheckScreen.js` | Profile photo scam checker |
| `HistoryScreen.js` | Scan history with filters (status, date) |
| `LoginScreen.js` | Email/password + Google sign-in, forgot password |
| `ResourcesScreen.js` | Links to official Malaysian anti-scam resources |
| `ReportScreen.js` | How to report scams to PDRM, NSRC, BNM, MCMC |
| `MainScreen.js` | Bottom tab navigator |

**Frontend (`frontend/context/`)**

| Context | Purpose |
|---|---|
| `AuthContext.js` | Firebase auth state (user object, sign-out) |
| `ThemeContext.js` | Dark / light theme tokens |
| `LanguageContext.js` | Language selection and persistence |

**Backend (`backend/app.py`)**

| Section | Purpose |
|---|---|
| Firebase Admin init | Token verification using `FIREBASE_CREDENTIALS_JSON` env var |
| `require_auth()` | Validates Bearer token on every request |
| Flask-Limiter | Rate limits per IP address |
| `analyze_with_ai()` | Sends text prompt to Groq, parses JSON response |
| `analyze_image_with_ai()` | Sends base64 image to Groq Vision |
| `check_virustotal_url()` | Submits URL to VirusTotal, reads vendor flags |
| `check_semak_mule()` | Queries PDRM Semak Mule for phone/bank/email |
| `check_phone_number()` | NumVerify validation + Malaysian prefix fallback |
| `check_social_handle()` | SerpAPI search for scam mentions |
| `/analyze` route | Main endpoint — orchestrates all checks, computes final score |
| `/check-profile` route | Profile photo endpoint |

### APIs & Integrations

| API | Endpoint / Method | What we use it for |
|---|---|---|
| Groq | `POST /openai/v1/chat/completions` | AI text + vision scam analysis |
| VirusTotal | `POST /api/v3/urls` + `GET /api/v3/analyses/{id}` | URL reputation scan |
| VirusTotal | `GET /api/v3/ip_addresses/{ip}` | IP reputation check |
| Semak Mule (PDRM) | `GET /semak?value=...` | Check phone/bank/email against scam registry |
| NumVerify | `GET /validate?number=...` | Phone number carrier and country info |
| SerpAPI | Google Search JSON API | Search for scam mentions of social handles |
| ImgBB | `POST /upload` | Temporary public URL for profile images |
| Firebase Auth | `verifyIdToken()` (Admin SDK) | Server-side token verification |
| Firebase Firestore | `collection/doc` SDK | Scan history and community reports |

### Database (Firebase Firestore)

```
Firestore
├── scans/
│   └── {userUID}/
│       └── entries/{autoID}
│           ├── input           — original text or "[Screenshot]"
│           ├── status          — "SAFE" | "SUSPICIOUS" | "SCAM"
│           ├── score           — integer 0–100
│           ├── reason          — one-line AI summary
│           ├── date            — ISO 8601 timestamp
│           └── localImagePath  — device file URI (image scans only)
│
└── reports/{inputKey}
    ├── input                   — original input text
    ├── count                   — total reports
    ├── reportedBy              — array of UIDs (prevents duplicate reports)
    └── lastReportedAt          — ISO 8601 timestamp
```

**Firestore Security Rules:**
- Users can only read/write their own scan history (`/scans/{uid}/entries/*` requires `auth.uid == uid`)
- Anyone can read report counts (needed before scan), only signed-in users can write

---

## 7. Score Calculation

### Score Ranges

| Score | Status | Meaning |
|---|---|---|
| 0 – 30 | SAFE | Low risk |
| 31 – 69 | SUSPICIOUS | Needs caution |
| 70 – 100 | SCAM | High risk — do not proceed |

### Calculation Steps

**Step 1 — Groq AI Base Score (0–100)**
The AI reads the full input and returns a base score based on Malaysian scam pattern recognition. Patterns include: Macau scam, government impersonation, fake jobs, investment scams, parcel scams, love scams, bank impersonation.

**Step 2 — VirusTotal URL Check**
If a URL is detected: submitted to VirusTotal. If flagged by any security vendor → **+20** to score.

**Step 3 — VirusTotal IP Check**
If an IP address is detected: checked against VirusTotal. If flagged → **+20** to score.

**Step 4 — Semak Mule (PDRM)**
If a phone number, bank account, or email is detected: queried against PDRM's Semak Mule database.

| Reports Found | Score Boost | Hard Minimum |
|---|---|---|
| 1 report | +20 | Score forced ≥ 75 (SCAM) |
| 2 reports | +40 | Score forced ≥ 85 |
| 3+ reports | +60 | Score forced ≥ 92 |

**Why hard override?** Semak Mule is PDRM's official scam database. If a number is registered there, it has already been reported as a scam by real victims. There is no false positive — a confirmed scam must always return SCAM.

**Step 5 — Phone Baseline Rule**
If the input is a bare phone number and AI score < 25: raise to 25 and add note *"Cannot determine safety from number alone."* The number alone isn't enough evidence — external checks decide.

**Step 6 — Social Handle Check (SerpAPI)**
If a social media handle is detected (`@username` or `platform.com/username`): SerpAPI searches for `"@handle" scam OR fraud OR penipu`. If scam-related results found → **+15 per result, up to +40**.

**Final sync:** After all steps, status is always re-derived from the final score to ensure consistency.

---

## 8. Results & Validation

### Testing Approach

| Test Case | Input | Expected | Result |
|---|---|---|---|
| Known scam number (in Semak Mule) | Registered scam phone number | SCAM ≥ 75 | SCAM 88/100 |
| Phishing URL | Known malicious URL | SCAM | SCAM 90/100 |
| Safe number | Personal phone number | SAFE or SUSPICIOUS | SUSPICIOUS 25/100 |
| Macau scam message | "Encik, saya dari SPRM, ada kes anda..." | SCAM | SCAM 92/100 |
| Fake job offer | "Kerja dari rumah RM5000 sebulan, tiada pengalaman perlu" | SCAM | SCAM 85/100 |
| Normal message | "Hi, boleh jumpa esok?" | SAFE | SAFE 5/100 |
| AI-generated profile photo | AI face image | SUSPICIOUS/SCAM | SCAM 82/100 |
| Real selfie | Normal photo | SAFE | SAFE 15/100 |

### Output Sample

```json
{
  "status": "SCAM",
  "score": 88,
  "reason": "Number registered in PDRM Semak Mule scam database with 2 reports",
  "findings": [
    "Phone number found in PDRM Semak Mule (2 reports)",
    "Malaysian mobile number — registered carrier detected",
    "High-risk: confirmed scam activity linked to this number"
  ]
}
```

### Security Validation

| Security Layer | Status |
|---|---|
| Firebase token verification on every API request | Active |
| Rate limiting (20 req/min on /analyze) | Active |
| Firestore rules (users can only access own data) | Active |
| API keys in environment variables (not in code) | Active |
| No secrets committed to git | Verified via .gitignore |

---

## 9. Team Contribution

| Member | Role |
|---|---|
| Aiman Razzi | Full-stack development — React Native frontend, Flask backend, Firebase integration, EAS build/deployment, all API integrations |

---

## 10. Market Feasibility

### Real-World Use

Combat. addresses a real, growing problem in Malaysia. With RM2.6 billion lost to scams in 2023 and increasing digital financial crime, there is strong demand for a quick, accessible scam verification tool.

**Who will use it:**
- General Malaysian public receiving suspicious messages on WhatsApp, Telegram, or SMS
- Elderly users who are prime targets for phone and Macau scams
- People verifying a contact before transferring money
- Users on dating apps verifying a profile before meeting someone

### Why It Matters

Existing tools require users to:
1. Go to Semak Mule website manually
2. Search VirusTotal separately
3. Google the phone number separately

Combat. combines all of these in one tap, with AI context added on top.

### Scalability

| Layer | Current (Free Tier) | Production Scale |
|---|---|---|
| Backend | Render free (512MB, 1 worker) | Render paid / AWS EC2 |
| AI | Groq free tier | Groq Pro or self-hosted Llama |
| Database | Firebase Spark (free) | Firebase Blaze or Supabase |
| Mobile | EAS free tier (30 builds/month) | EAS Production plan |
| Auth | Firebase free (10K users/month) | Scales automatically |

The app architecture is stateless — the Flask backend holds no session data. Scaling is simply adding more workers or switching to a larger compute instance.

---

## 11. Limitations & Future Improvements

### Current Limitations

| Limitation | Reason |
|---|---|
| Images not synced across devices | Firebase Storage requires paid plan (Blaze). Images stored as local device path only |
| Google Sign-In fails on emulators | SHA-1 certificate mismatch — must test on real device |
| Render free tier cold start | First request after idle period takes 10–15 seconds |
| react-native-share (image+text share) only works in APK | Native module not available in Expo Go |
| Semak Mule limited to phone/bank/email | PDRM API does not cover URLs or IPs |
| Community reports susceptible to spam | Mitigated by: one report per UID, 5+ threshold for strong warning, AI always runs independently |

### Future Improvements

**Short Term**
- Firebase Storage (Blaze plan) — images persist across devices
- Native iOS build (EAS Build) — full feature parity, no Expo Go dependency
- Admin dashboard — manage community reports, remove false ones

**Medium Term**
- Push notifications — alert users when a scam number they've seen gets reported
- Pre-loaded Malaysia scam number database — instant offline check
- Browser extension — real-time URL warning while browsing

**Long Term**
- Custom ML model trained on Malaysian scam datasets — faster, cheaper, fully offline
- Partnership with PDRM / MCMC for official API access with higher rate limits
- Public community scam feed — browse recent community reports across Malaysia

---

## 12. Deployment

### Backend — Render

- Platform: Render (free tier, Python 3.14)
- WSGI Server: Gunicorn
- Start command: `gunicorn app:app --bind 0.0.0.0:$PORT --timeout 120 --workers 1 --threads 2`
- All API keys stored as Render environment variables (never in code or git)
- Auto-deploys on every push to `main` branch

### Frontend — Expo EAS

| Distribution | Method |
|---|---|
| Android APK | `eas build --profile preview --platform android` |
| OTA JS Updates | `eas update --branch preview` — no new APK needed |
| iOS (Expo Go) | Share Expo update link — open in Safari on iPhone |

**Runtime version:** `exposdk:54.0.0`

---

## 13. Project File Structure

```
scam-detector/
├── README.md                        Setup and run instructions
├── PROJECT_DOCUMENTATION.md         This file
├── render.yaml                      Render deployment config
│
├── frontend/
│   ├── app.json                     Expo config (EAS project ID, runtime version)
│   ├── eas.json                     EAS build profiles
│   ├── firebase.js                  Firebase SDK init
│   ├── config.js                    Backend URL
│   │
│   ├── screens/
│   │   ├── HomeScreen.js            Main scan screen (text + image)
│   │   ├── QRScreen.js              QR code scanner
│   │   ├── ProfileCheckScreen.js    Profile photo checker
│   │   ├── HistoryScreen.js         Scan history
│   │   ├── LoginScreen.js           Auth screen
│   │   ├── ResourcesScreen.js       Anti-scam resource links
│   │   ├── ReportScreen.js          How to report scams
│   │   ├── MainScreen.js            Tab navigator
│   │   ├── AccountScreen.js         User account + sign out
│   │   ├── SplashScreen.js          Loading screen
│   │   └── TipsScreen.js            Scam awareness tips
│   │
│   ├── context/
│   │   ├── AuthContext.js           Auth state provider
│   │   ├── ThemeContext.js          Theme provider (dark/light)
│   │   └── LanguageContext.js       Language provider
│   │
│   └── utils/
│       ├── api.js                   securePost() — attaches Firebase Bearer token
│       └── translations.js          EN / MY / ZH / TA string definitions
│
└── backend/
    ├── app.py                       All Flask routes + AI/API logic
    ├── requirements.txt             Python dependencies
    └── render.yaml                  Render service config
```

---

*Combat. — Hackathon Submission | April 2026*
