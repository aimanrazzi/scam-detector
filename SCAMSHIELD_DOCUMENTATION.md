# ScamShield — Technical Documentation
> Hackathon Project | Team Reference Document

---

## 1. What Is ScamShield?

ScamShield is a mobile app that helps users detect scams in real time. Users can paste suspicious messages, phone numbers, URLs, emails, bank accounts, social handles — or upload screenshots — and the app returns a risk score with a detailed explanation.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Mobile Frontend | React Native + Expo SDK 54 |
| Backend API | Python Flask |
| AI — Text Analysis | Groq `llama-3.3-70b-versatile` |
| AI — Image / Vision | Groq `meta-llama/llama-4-scout-17b-16e-instruct` |
| Database | Firebase Firestore (Spark free plan) |
| Auth | Firebase Authentication (Google Sign-In) |
| Phone Validation | NumVerify API + local Malaysian prefix table (fallback) |
| URL / IP Threat Check | VirusTotal API |
| URL Threat Database | Kaggle Malicious URLs Dataset (phishing / malware / defacement) |
| Malaysia Scam Registry | PDRM Semak Mule (phone, bank account, email) |
| Social Handle Check | SerpAPI Google Search |
| Image Hosting (temp) | ImgBB API (for SerpAPI reverse image search) |
| Backend Hosting | Render (free tier) |
| Frontend Distribution | EAS Update (Expo CDN) + EAS Build (APK) |

---

## 3. Score System — Detailed Breakdown

### Score Range

| Score | Status | Colour |
|---|---|---|
| 0 – 30 | SAFE | Green |
| 31 – 69 | SUSPICIOUS | Amber |
| 70 – 100 | SCAM | Red |

---

### How the Score is Calculated (Step by Step)

The backend runs up to 6 steps in sequence for every text scan. Each step can raise the score.

#### Step 1 — Groq AI Base Score
The AI reads the full input and returns a base score (0–100), a status, a one-line reason, and 2–4 bullet findings.

```
Input: "Tahniah! Anda menang RM5000. Klik link ini sekarang."
AI Base Score → 85 (SCAM)
```

The AI follows these rules:
- Phishing links, fake prizes, urgent money requests → high score
- A plain phone number alone → AI gives low score (can't judge from number alone)
- Spelling or grammar errors by the user are ignored — only the content is judged

---

#### Step 2 — URL Check (VirusTotal)
If a URL is detected in the input:
- Sent to VirusTotal for analysis
- If flagged by VirusTotal (malicious or suspicious vendors): **+20 to score**

```
AI Score: 60 + VirusTotal flagged → 80 (SCAM)
```

---

#### Step 3 — IP Address Check (VirusTotal)
If an IP address is detected (and no URL was found):
- Sent to VirusTotal
- If flagged: **+20 to score**

---

#### Step 4 — Malicious URL Dataset Check (Kaggle)
If a URL is detected, it is also checked against a local Kaggle dataset of known malicious URLs.

| Dataset Label | Score Boost |
|---|---|
| Phishing | +50 |
| Malware | +55 |
| Defacement | +40 |

This check is instant (no API call) — data is loaded in memory at server start.

---

#### Step 5 — Phone Number Handling
If a phone number is detected:
- **Phone baseline rule:** AI alone cannot judge a bare number, so if AI score < 25, it is raised to **25 (floor)** and a note is added: *"Cannot determine safety from number alone."*
- Number is validated via NumVerify API (carrier, country, line type) — or local Malaysian prefix table as fallback
- Number is checked against **PDRM Semak Mule**

**Semak Mule Score Boost:**

| Semak Mule Reports | Boost Added |
|---|---|
| 1 report | +20 |
| 2 reports | +40 |
| 3+ reports | +60 (capped) |

```
Phone number, AI score: 25
Semak Mule: 2 reports found → +40
Final score: 65 (SUSPICIOUS)
```

---

#### Step 6 — Email, Bank Account, Social Handle
Same Semak Mule boost logic applies to email and bank account numbers.

For **social media handles** (`@username` or `platform.com/username`):
- SerpAPI searches `"@handle" platform scam OR fraud OR penipu`
- If scam-related results found: **+15 per result, up to +40**

---

#### Final Score Sync
After all steps, the status is always re-synced to match the final score:
- Score ≥ 70 → SCAM
- Score 31–69 → SUSPICIOUS
- Score ≤ 30 → SAFE

---

### Profile Checker Score (separate from main scan)

| Condition | Effect |
|---|---|
| Public figure identified by name | Hard-set score = **90, status = SCAM** |
| AI-generated photo detected | **+15** to AI score, if ≥ 70 → SCAM |
| Stock photo detected | Score capped at **60, status = SUSPICIOUS** |
| Looks like a real selfie | Score **-20** (benefit of the doubt), if < 31 → SAFE |
| Non-person image (cartoon, object) | Rejected with error |

---

### Community Reports (frontend layer — does not change AI score)

| Reports Count | Display |
|---|---|
| 0 | Nothing shown |
| 1 – 4 | ⚠️ Amber warning: "X users reported this as suspicious" |
| 5+ | 🚨 Red warning: "X users flagged this as a scam — high risk" |

> Community reports are shown alongside the AI verdict. They never override it. The AI always runs and always decides the score.

---

## 4. App Features

### 4.1 Text Input Analysis
User pastes any suspicious text. Backend auto-detects the content type:

| Detected Type | APIs Called |
|---|---|
| URL / Link | VirusTotal + Kaggle dataset + Groq AI |
| IP Address | VirusTotal + Groq AI |
| Phone Number | NumVerify (or local table) + Semak Mule + Groq AI |
| Bank Account | Semak Mule + Groq AI |
| Email Address | Semak Mule + Groq AI |
| Social Handle | SerpAPI search + Groq AI |
| General Message | Groq AI only |

Detection priority: URL → IP → Phone → Bank Account + Email + Social (all three can co-exist).

---

### 4.2 Screenshot / Image Analysis
User uploads or photographs a screenshot. Groq Vision reads the image and detects:
- Scam message text in the screenshot
- Suspicious links or numbers in the image
- Urgency language, fake promotions, lottery scam formats

Image is resized to max 800×800 before being sent to save tokens.

---

### 4.3 Profile Checker
User uploads a profile photo (e.g. from dating app, WhatsApp). Groq Vision checks:
- Is it AI-generated? (featureless blur, perfect skin, rendered look)
- Is it a stock photo? (studio lighting, plain background, model pose)
- Is a visible social handle shown in the image?
- Is the person a known public figure / celebrity?

If a public figure is identified by name → instant SCAM 90/100 with impersonation warning.

---

### 4.4 QR Code Scanner
User scans a QR code. The embedded URL is extracted and passed through the same URL analysis pipeline as text input.

---

### 4.5 Scan History
Every scan is saved automatically after a result is returned.

| User Type | Storage |
|---|---|
| Logged in (Google) | Firebase Firestore — cloud, permanent |
| Guest | AsyncStorage — local device only, max 50 entries |

History view shows: date, status badge, score, reason, image thumbnail (if applicable), and a share button.

---

### 4.6 Community Reports
After any **text input** scan:
- A `🚨 Report as Scam` button appears at the bottom of the result
- Tapping it saves a report to Firestore `reports/{inputKey}`
- The counter increments permanently
- The user's UID is stored — they cannot report the same input twice
- Must be signed in to report (guests see "Sign in required")
- On the next scan of the same input, the community report count is shown alongside the AI result

---

### 4.7 Share Results
From the History screen, any saved result can be shared:
- **Android APK** → image + analysis text shared together via native share sheet
- **Expo Go** → text-only sharing (native image share requires a native build)

---

### 4.8 Multi-Language
Language selector in the top bar. AI reasons and findings are returned in the selected language. Supported: English, Bahasa Malaysia, Chinese (Simplified), Tamil.

### 4.9 Dark / Light Theme
Toggle in the top bar. Theme applied across all screens.

---

## 5. Database Structure (Firestore)

```
Firestore
│
├── scans/
│   └── {userUID}/
│       └── entries/
│           └── {autoID}
│               ├── input          — typed text or "[Screenshot]"
│               ├── status         — "SAFE" | "SUSPICIOUS" | "SCAM"
│               ├── score          — 0 to 100
│               ├── reason         — one-line AI summary
│               ├── date           — ISO 8601 timestamp
│               └── localImagePath — device file URI (image scans only)
│
└── reports/
    └── {inputKey}                 — normalized input as document ID
        ├── input                  — original input text
        ├── count                  — total number of reports
        ├── reportedBy             — array of UIDs who reported
        └── lastReportedAt         — ISO 8601 timestamp
```

### Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users can only read/write their own scan history
    match /scans/{uid}/entries/{entry} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    // Reports — anyone can read (needed for count check before scan)
    // Only signed-in users can write
    match /reports/{key} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

---

## 6. Deployment

### Backend — Render
- Platform: Render (free tier)
- Language: Python 3
- Server: Gunicorn
- Start command:
  ```
  cd backend && python -m gunicorn app:app --bind 0.0.0.0:$PORT --timeout 120 --workers 1 --threads 2
  ```
- All API keys stored as environment variables in Render dashboard (not in code)
- **Cold start:** Free tier spins down after inactivity. First request after idle = 10–15 second delay. App shows *"Waking up server…"* message to the user after 6 seconds.

### Frontend — Expo EAS

| Platform | Method | Details |
|---|---|---|
| Android | EAS Build → APK | `eas build --platform android --profile preview` |
| iOS | EAS Update → Expo Go | Open link in Safari, app launches in Expo Go |
| OTA Updates | EAS Update | JS bundle pushed to Expo CDN, no new APK needed |

**Runtime version:** `exposdk:54.0.0` — required for Expo Go compatibility.

---

## 7. Android APK

- Package name: `com.aimanrazzi.scamdetector`
- Built with EAS Build `preview` profile → outputs `.apk` (not `.aab`)
- Distribution: share the `.apk` file directly (WhatsApp, Google Drive, etc.)
- Users must enable **"Install from unknown sources"** on their Android device

---

## 8. iOS — Expo Go

- No App Store required
- Users install **Expo Go** from the App Store (free)
- To open the app, open this link in **Safari** on iPhone:

```
exp://u.expo.dev/bea01942-8bf5-4f14-b80b-63315b32aa13/group/4cbf5da3-8d00-43af-a7a1-e4b7833b9a50
```

- Safari will prompt to open in Expo Go automatically
- **Limitation:** Some native features (image+text sharing together) require a native build — not available in Expo Go

---

## 9. APIs Used

| API | Purpose | Free Tier |
|---|---|---|
| Groq | AI text + vision analysis | Generous free tier |
| VirusTotal | URL and IP threat scanning | 4 requests/min |
| NumVerify | Phone number validation (carrier, country, line type) | 100 requests/month |
| PDRM Semak Mule | Malaysia scam registry (phone, bank, email) | Free (official gov API) |
| SerpAPI | Social handle scam search + profile reverse image | 100 searches/month |
| ImgBB | Temporary public image URL for SerpAPI | Free |
| Firebase | Auth + Firestore database | Free (Spark plan) |
| Kaggle Dataset | Local malicious URL database (loaded at server start) | Free (static file) |

---

## 10. Challenges We Faced

### 1. Gunicorn Worker Timeout
**Problem:** Backend crashed on slow AI requests — Groq sometimes takes over 30 seconds.
**Fix:** Added `--timeout 120 --workers 1 --threads 2` to Gunicorn command.

---

### 2. Firebase Storage Requires Paid Plan
**Problem:** Storing images in Firebase Storage requires upgrading from Spark (free) to Blaze (pay-as-you-go).
**Fix:** Used the local device file path (`image.uri` from ImagePicker) directly. Images show as thumbnails on the same device but won't load cross-device. Acceptable for demo.

---

### 3. Profile Checker False Positives
**Problem:** SerpAPI Google Lens returns visual similarity matches from retail/lifestyle sites, flagging normal photos as "found on Instagram/Facebook" — false positives.
**Fix:** Removed reverse image search from the scoring logic entirely. Only flag impersonation when Groq AI identifies the person by name.

---

### 4. Invalid Date in Scan History
**Problem:** Old scans saved using `toLocaleString("en-MY")` returned format like `"5/4/2026, 9:16:00 AM"` — not parseable as a standard Date object.
**Fix:** Added `parseDate()` function with `isNaN` fallback check — displays raw string if parsing fails.

---

### 5. Scan History Not Refreshing on Tab Switch
**Problem:** `useCallback` with empty `[]` dependency caused stale closure — history loaded once and never re-fetched.
**Fix:** Wrapped `loadHistory` in `useCallback`, used `useFocusEffect` to re-run on every tab focus event.

---

### 6. Expo Go Crash — react-native-share
**Problem:** Top-level `import RNShare from 'react-native-share'` crashes Expo Go because the native module is not bundled.
**Fix:** Dynamic `require()` inside a `try/catch` — gracefully falls back to text-only sharing if the native module is unavailable.

---

### 7. EAS Update Not Opening in Expo Go
**Problem:** `runtimeVersion: { policy: "appVersion" }` produces version string `"1.0.0"`. Expo Go expects `"exposdk:54.0.0"` — mismatch causes the link to open the Expo project dashboard instead of the app.
**Fix:** Changed policy to `"sdkVersion"` — EAS Update now publishes with `exposdk:54.0.0`, which Expo Go accepts.

---

### 8. Google Sign-In on Emulators
**Problem:** Google Sign-In fails on BlueStacks and Android Studio emulator — SHA-1 certificate mismatch with the debug keystore.
**Workaround:** Google Sign-In must be tested on real physical devices only.

---

### 9. Community Report Sabotage Risk
**Problem:** Users could spam reports to falsely flag legitimate numbers or messages.
**Fix applied:**
- One report per user (UID stored in `reportedBy` array)
- Must be signed in to report
- AI always runs — reports never override or skip the AI verdict
- Requires 5+ reports for the strong red warning (not 1)

---

## 11. Potential Improvements

### Short Term

| Improvement | Reason |
|---|---|
| Upgrade Firebase to Blaze plan | Enable Firebase Storage — images persist across devices |
| Build native iOS app (EAS Build) | Full feature parity with Android, no Expo Go dependency |
| Admin dashboard | View and manage community reports, remove false ones |
| Raise report threshold to 10+ | Better protection against coordinated sabotage |

### Medium Term

| Improvement | Reason |
|---|---|
| Push notifications | Alert users when a number they scanned gets new community reports |
| Pre-loaded Malaysia scam number list | Instant check for known scam numbers — no API call needed |
| Offline mode | Show cached results without internet |
| More language support | Full BM, Tamil, Mandarin translations |

### Long Term

| Improvement | Reason |
|---|---|
| Custom ML model trained on scam datasets | Faster, cheaper, no reliance on external AI APIs |
| Kaggle scam message datasets | Train a classifier on labelled scam messages for offline detection |
| Public community scam feed | Browse recent reports from all users |
| Browser extension | Warn users about suspicious links while browsing the web |
| Partnership with PDRM / MCMC | Official scam database API integration |

---

## 12. Project File Structure

```
scam-detector/
├── frontend/                        React Native app
│   ├── screens/
│   │   ├── HomeScreen.js            Main scan screen (text + image)
│   │   ├── HistoryScreen.js         Scan history (cloud + local)
│   │   ├── ProfileCheckScreen.js    Profile photo checker
│   │   ├── QRScanScreen.js          QR code scanner
│   │   └── ResourcesScreen.js       Scam awareness resources
│   ├── context/
│   │   ├── AuthContext.js           Firebase auth state management
│   │   ├── LanguageContext.js       Language switching
│   │   └── ThemeContext.js          Dark / light theme
│   ├── utils/translations.js        Multi-language string definitions
│   ├── firebase.js                  Firebase init (auth + firestore exports)
│   ├── config.js                    Backend URL
│   └── app.json                     Expo config (EAS project ID, runtime version)
│
├── backend/
│   ├── app.py                       All Flask routes and AI/API logic
│   ├── malicious_phish.csv          Kaggle malicious URL dataset (local)
│   └── .env                         API keys (not committed to git)
│
├── render.yaml                      Render deployment config
└── SCAMSHIELD_DOCUMENTATION.md      This file
```

---

*Document generated: April 2026 | ScamShield Hackathon Team*
