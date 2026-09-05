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
- **Multimodal Veterinary Assessor:** Powered by `gemini-3.6-flash` using clinical recumbency markers (lateral recumbency, flaccid tone, closed eyes) without triggering gore/harm safety filters.
- **Taxonomic Classifier:** Distinguishes agouti/brown wild hares (*Lepus nigricollis*) from albino/fancy pet breeds.
- **Backend Service:** FastAPI with full CORS support and built-in exponential backoff for rate-limit protection.

---

## Installation & Setup

### 1. Install Dependencies
```bash
pip install -r requirements.txt