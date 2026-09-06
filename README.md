# ChakkaCheck 🍈🐇

> Automated forensic verification for the canonical Malayalam proverb: *"Chakka veenu muyal chathu"* (A jackfruit fell, a rabbit died).

Built for the **TinkerHub Useless Projects Hackathon**.

---

## The Useless Problem Statement
In Kerala folklore, purely accidental coincidences are colloquially referred to as *"Chakka veenu muyal chathu"*. But did an actual falling jackfruit cause the demise of a genuine wild hare?

**ChakkaCheck** is an over-engineered computer vision and multimodal pipeline designed to forensically audit uploaded imagery and determine whether the canonical incident truly transpired.

---

## Verification Criteria
To achieve a **TRUE** verdict (100% match score), an incident must satisfy four strict rules:
1. **Jackfruit Present:** Impacted or fallen jackfruit (*Artocarpus heterophyllus*) on the ground.
2. **Lagomorph Present:** A rabbit or hare identified in the immediate blast radius.
3. **True Wild Specimen:** Must be a wild Indian hare (*Lepus nigricollis* / *kattu muyal*). Fluffy white domestic pet store rabbits (*valarthu muyal*) are automatically disqualified!
4. **Clinical Lethality / Recumbency:** Multimodal veterinary assessment verifying lateral recumbency, limp posture, and closed eyes.

---

## Forensic Decision Matrix

| Jackfruit? | Rabbit? | Breed / Type | Posture / State | Verdict | Score | Forensic Finding / Commentary |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Yes** | **Yes** | Wild (*kattu muyal*) | Unresponsive | **TRUE** | **100** | Canonical accident confirmed! (*Sambhavam Sathyam!*) |
| **Yes** | **Yes** | Domestic (*valarthu muyal*) | Unresponsive | **FALSE** | **75** | Pet rabbit disqualified. Needs genuine wild hare. |
| **Yes** | **Yes** | Either | Alert / Alive | **FALSE** | **65** | Missed strike! (*Muyal alive aanu bro!*) |
| **No** | **Yes** | Wild / Domestic | Unresponsive | **FALSE** | **45** | Suspicious death! Likely natural causes; weapon missing. |
| **Yes** | **No** | None | N/A | **FALSE** | **30** | Jackfruit fell, but rabbit escaped. |
| **No** | **Yes** | Wild / Domestic | Alert / Alive | **FALSE** | **25** | Innocent bystander bunny hopping through meadow. |
| **No** | **No** | None | N/A | **FALSE** | **0** | Irrelevant image. Neither subject present. |

---

## Technical Architecture
- **Object Detection Layer:** Custom YOLOv8s weights (`best.pt`) detecting jackfruits and rabbits at low confidence thresholds to handle diffusion-smoothed AI renders.
- **Multimodal Veterinary Assessor:** Powered by `gemini-2.5-flash-lite` (with fallbacks) using clinical recumbency markers (lateral recumbency, flaccid tone, closed eyes) without triggering gore/harm safety filters. Includes a 3-attempt exponential backoff for rate limit protection.
- **Taxonomic Classifier:** Distinguishes agouti/brown wild hares (*Lepus nigricollis*) from albino/fancy pet breeds.
- **Backend Service:** FastAPI with full CORS support. YOLO inference is wrapped in `run_in_threadpool` for non-blocking ASGI event loop execution.

---

## Local Development

### 1. Environment Setup
1. Create a `.env` in the root for the backend:
   ```env
   GEMINI_API_KEY=your_key_here
   ```
2. Copy `.env.example` to `.env.local` for the frontend (optional, defaults to localhost proxy):
   ```env
   VITE_API_URL=http://localhost:8000
   ```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
npm install
```

### 3. Start Services
**Terminal 1 (Backend):**
```bash
uvicorn main:app --reload --port 8000
```

**Terminal 2 (Frontend):**
```bash
npm run dev
```

---

## Public Demo / Hackathon Presentation (No Cloud Hosting)

Because of the heavy Machine Learning pipeline (PyTorch + YOLOv8) which demands significant RAM, this project exceeds the constraints of free-tier cloud platforms (like Render's 512MB limit) and often struggles with stable tunneling via proxies. 

**For hackathon presentations, run the app locally and tunnel it using SSH:**

1. Build the unified frontend + backend:
```bash
npm run build
```
2. Start the unified server on port `8000`:
```bash
uvicorn main:app --port 8000
```
3. Expose it securely to the internet using Pinggy (no installation required!):
```bash
ssh -p 443 -R0:localhost:8000 a.pinggy.io
```
This will instantly generate a public `https://...pinggy.link` URL that you can share with judges for live testing, running off your laptop's hardware!
