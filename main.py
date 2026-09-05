import os
import io
import json
import time
import traceback
from typing import Optional, Literal, Any
from fastapi import FastAPI, UploadFile, File, HTTPException
from starlette.concurrency import run_in_threadpool
from fastapi.staticfiles import StaticFiles
import os
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from ultralytics import YOLO
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="ChakkaCheck API", version="1.5.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = "best.pt"
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY") or "AQ.Ab8RN6Jy0oUg3zr8D6N4xFEcN1OnnomvfdCg-mo-gwTWxYLhSw"

try:
    yolo_model = YOLO(MODEL_PATH)
except Exception as e:
    raise RuntimeError(f"Failed to load YOLO model from {MODEL_PATH}: {e}")

client = None
if GEMINI_API_KEY:
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
    except Exception as e:
        print(f">>> Warning: Could not initialize Gemini client at startup: {e}")


class GeminiForensicEvaluation(BaseModel):
    jackfruit_detected: bool = Field(description="Is a jackfruit present in the scene?")
    rabbit_detected: bool = Field(description="Is a rabbit or wild hare present in the scene?")
    is_wild: bool = Field(description="True ONLY if there is clear visual morphological evidence of a wild hare. False if domestic or uncertain.")
    rabbit_type: Literal["wild", "domestic", "none"] = Field(description="Classification of the lagomorph: 'wild', 'domestic', or 'none'.")
    wild_assessment: Literal["wild", "domestic", "uncertain"] = Field(description="Species assessment category.")
    wild_confidence: float = Field(description="Confidence in wild classification from 0.0 to 1.0.")
    is_unresponsive: bool = Field(description="True ONLY if the rabbit shows clear visual signs of being incapacitated/unresponsive. False if alert, resting, or sleeping normally.")
    unresponsive_confidence: float = Field(description="Confidence in unresponsive/incapacitated status from 0.0 to 1.0.")
    wild_evidence: str = Field(description="Concise description of morphological traits used for wild vs domestic assessment.")
    unresponsive_evidence: str = Field(description="Concise description of posture, tone, and physical impact context.")
    clinical_notes: str = Field(description="1-2 sentence overall visual summary for forensic notes.")


def safe_bool(val: Any, default: bool = False) -> bool:
    """Robustly parse boolean without string-truthiness pitfalls."""
    if isinstance(val, bool):
        return val
    if isinstance(val, (int, float)):
        return bool(val)
    if isinstance(val, str):
        cleaned = val.strip().lower()
        if cleaned in ("true", "1", "yes", "t"):
            return True
        if cleaned in ("false", "0", "no", "f", "uncertain", "none", "null"):
            return False
    return default


def evaluate_scene_with_gemini(
    image: Image.Image,
    rabbit_crop: Optional[Image.Image] = None
) -> dict:
    """
    Evaluates the scene using Gemini 3.6 Flash with single API call, structured Pydantic schema,
    and automated 429 backoff.
    """
    global client
    if client is None:
        key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY") or "AQ.Ab8RN6Jy0oUg3zr8D6N4xFEcN1OnnomvfdCg-mo-gwTWxYLhSw"
        if key:
            try:
                client = genai.Client(api_key=key)
            except Exception as e:
                print(f">>> Failed to create Gemini client: {e}")
        if client is None:
            return {
                "jackfruit_detected": False,
                "rabbit_detected": False,
                "is_wild": False,
                "rabbit_type": "none",
                "wild_assessment": "uncertain",
                "wild_confidence": 0.0,
                "is_unresponsive": False,
                "unresponsive_confidence": 0.0,
                "wild_evidence": "Gemini API key not configured.",
                "unresponsive_evidence": "Gemini API key not configured.",
                "clinical_notes": "YOLO visual analysis executed. Gemini multimodal vision key not configured."
            }

    prompt = """
You are an expert veterinary and botanical forensic analyst verifying the Kerala folklore scenario: 'Chakka veenu muyal chathu' (A jackfruit fell, a rabbit died).

You are analyzing a humorous visual interpretation of the proverb. Perform an objective, rigorous visual inspection.

==================================================
TASKS:
==================================================
TASK 1: Determine if a jackfruit (Artocarpus heterophyllus) is present on the ground.
TASK 2: Determine if a rabbit or wild hare is present in the scene.
TASK 3: Determine whether the rabbit visually resembles a WILD HARE (e.g., Indian hare / Lepus nigricollis) or a DOMESTIC RABBIT (pet breed).
TASK 4: Determine whether the rabbit appears visually UNRESPONSIVE / INCAPACITATED in this scene.

==================================================
IMAGE ROLES:
==================================================
- If provided, IMAGE 1 is the FULL SCENE.
  Use IMAGE 1 for: overall scene context, jackfruit location, surroundings, and the physical relationship/proximity between the jackfruit and rabbit.
- If provided, IMAGE 2 is the CROPPED PRIMARY RABBIT.
  Use IMAGE 2 for: close-up inspection of fine morphological details (eyes, ears, fur pattern, body profile, limbs, facial structure, posture).
  NOTE: IMAGE 2 is a crop of the same rabbit from IMAGE 1, NOT a second rabbit.

==================================================
CRITICAL SPECIES (WILD VS DOMESTIC) RULES:
==================================================
1. Do NOT rely on coat color alone!
   - Brown does NOT automatically mean wild. Many domestic pet rabbits (e.g. agouti pet breeds, Flemish Giants, Belgian Hares, Dutch rabbits) are brown.
   - White does NOT automatically mean domestic.
   - Coat color alone is NEVER sufficient evidence.
2. Evaluate skeletal morphology and anatomical proportions:
   - WILD HARE (Lepus nigricollis / Indian hare): Long, lean, athletic body profile; disproportionately long powerful hind limbs; large elongated ears often with dark/black-tipped margins or dark nape marking; slender angular skull.
   - DOMESTIC RABBIT (Oryctolagus cuniculus breeds): Rounded, compact, stocky body build; shorter ears relative to head size; blunt facial profile; softer, denser pet coat.
3. If evidence is ambiguous, mixed, or low-resolution:
   - Set wild_assessment = "uncertain"
   - Set wild_confidence below 0.50
   - Set is_wild = false
   - Do NOT guess or promote uncertainty to wild.

==================================================
CRITICAL POSTURE (UNRESPONSIVE / DEAD) RULES:
==================================================
1. "A still photograph cannot prove biological death." We are NOT asking you to medically certify death.
2. We are asking: "Does the rabbit appear visually unresponsive or incapacitated in this scene?"
3. Distinguish active postures from normal resting vs. incapacitation:
   - A. Standing / actively hopping
   - B. Sitting / alert / crouched sphinx posture
   - C. Sleeping / relaxed ("bunny flop", healthy rabbits resting comfortably on side)
   - D. Lying down normally
   - E. Apparently unresponsive / incapacitated
4. Lying on its side does NOT automatically mean dead (healthy pet rabbits frequently flop on their sides when resting).
5. Closed eyes do NOT automatically mean dead (sleeping/napping rabbits have closed eyes).
6. Lateral recumbency does NOT automatically mean dead.
7. To classify as is_unresponsive = true:
   - Look for a combination of visual signs of incapacitation or trauma: collapsed, unnaturally limp or contorted body posture, lack of normal muscle tone, abnormal/splayed limb positioning, visible blunt trauma/crush injury, or proximity to a shattered/impacted jackfruit.
   - If the rabbit simply appears to be resting, napping, or sitting peacefully, it is NOT unresponsive (set is_unresponsive = false).
8. When uncertain, choose the conservative classification (is_unresponsive = false).
"""

    contents = [prompt]
    if rabbit_crop is not None:
        contents.append("IMAGE 1 (FULL SCENE):")
        contents.append(image)
        contents.append("IMAGE 2 (CROPPED PRIMARY RABBIT - close-up view of the same rabbit):")
        contents.append(rabbit_crop)
    else:
        contents.append("IMAGE 1 (FULL SCENE):")
        contents.append(image)

    safety_settings = [
        types.SafetySetting(category=types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold=types.HarmBlockThreshold.BLOCK_ONLY_HIGH),
        types.SafetySetting(category=types.HarmCategory.HARM_CATEGORY_HARASSMENT, threshold=types.HarmBlockThreshold.BLOCK_ONLY_HIGH),
        types.SafetySetting(category=types.HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold=types.HarmBlockThreshold.BLOCK_ONLY_HIGH),
        types.SafetySetting(category=types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold=types.HarmBlockThreshold.BLOCK_ONLY_HIGH),
    ]
    candidate_models = ["gemini-2.5-flash-lite", "gemini-2.0-flash", "gemini-3.6-flash"]

    last_err = None
    for model_name in candidate_models:
        for attempt in range(3):
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=contents,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=GeminiForensicEvaluation,
                        safety_settings=safety_settings
                    )
                )
                raw_text = response.text.strip()
                parsed = json.loads(raw_text)
                print(f">>> GEMINI STRUCTURED ANALYSIS ({model_name}):", parsed)
                return parsed
            except Exception as err:
                last_err = err
                err_str = str(err)
                if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                    sleep_duration = 3 * (attempt + 1)
                    print(f">>> Rate limited on {model_name} (attempt {attempt + 1}). Pausing for {sleep_duration}s...")
                    time.sleep(sleep_duration)
                    continue
                print(f">>> GEMINI MODEL {model_name} ERROR:", err)
                break
    err_str = str(last_err) if last_err else "All Gemini models failed"
    print(">>> GEMINI ALL MODELS FAILED:", err_str)
    return {
        "jackfruit_detected": False,
        "rabbit_detected": False,
        "is_wild": False,
        "rabbit_type": "none",
        "wild_assessment": "uncertain",
        "wild_confidence": 0.0,
        "is_unresponsive": False,
        "unresponsive_confidence": 0.0,
        "wild_evidence": f"Gemini error: {err_str}",
        "unresponsive_evidence": "Analysis could not be completed.",
        "clinical_notes": f"Gemini error: {err_str}"
    }


    return {
        "jackfruit_detected": False,
        "rabbit_detected": False,
        "is_wild": False,
        "rabbit_type": "none",
        "wild_assessment": "uncertain",
        "wild_confidence": 0.0,
        "is_unresponsive": False,
        "unresponsive_confidence": 0.0,
        "wild_evidence": "API rate limit reached.",
        "unresponsive_evidence": "Rate limit exceeded.",
        "clinical_notes": "API rate limit reached. Please wait a moment and re-upload."
    }


@app.get("/api/health")
def health_check():
    return {"status": "ok", "project": "ChakkaCheck", "version": "1.5.0"}


@app.post("/api/analyze")
async def analyze_scene(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    image_bytes = await file.read()
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Corrupted image file.")

    # 1. Run YOLO object detection
    raw_results = await run_in_threadpool(yolo_model, image, conf=0.10)
    yolo_results = raw_results[0]

    yolo_jackfruit = False
    yolo_rabbit = False
    best_rabbit_conf = -1.0
    best_rabbit_box = None
    yolo_jackfruit_conf = 0.0

    for box in yolo_results.boxes:
        cls_id = int(box.cls[0])
        cls_name = yolo_results.names[cls_id].lower()
        conf = float(box.conf[0])
        print(f">>> YOLO: {cls_name} (class {cls_id}) - conf: {conf:.2f}")

        if "jackfruit" in cls_name or cls_id == 0:
            yolo_jackfruit = True
            if conf > yolo_jackfruit_conf:
                yolo_jackfruit_conf = conf
        elif "rabbit" in cls_name or cls_id == 1:
            yolo_rabbit = True
            if conf > best_rabbit_conf:
                best_rabbit_conf = conf
                best_rabbit_box = box.xyxy[0].tolist()

    # 2. Preserve YOLO bounding box & generate safe rabbit crop
    rabbit_crop = None
    crop_dimensions = None
    if best_rabbit_box is not None:
        try:
            img_w, img_h = image.size
            x1, y1, x2, y2 = best_rabbit_box
            w = x2 - x1
            h = y2 - y1
            
            # Add 10% clamped margin
            margin_x = 0.10 * w
            margin_y = 0.10 * h
            
            x1 -= margin_x
            y1 -= margin_y
            x2 += margin_x
            y2 += margin_y
            
            ix1 = max(0, min(int(x1), img_w - 1))
            iy1 = max(0, min(int(y1), img_h - 1))
            ix2 = max(ix1 + 1, min(int(x2), img_w))
            iy2 = max(iy1 + 1, min(int(y2), img_h))

            crop_w = ix2 - ix1
            crop_h = iy2 - iy1
            if crop_w >= 3 and crop_h >= 3:
                rabbit_crop = image.crop((ix1, iy1, ix2, iy2))
                crop_dimensions = (crop_w, crop_h)
                print(f">>> RABBIT CROP: Box=({ix1}, {iy1}, {ix2}, {iy2}), Dimensions={crop_dimensions}")
            else:
                print(f">>> RABBIT CROP: Box too small ({crop_w}x{crop_h}), using full scene.")
        except Exception as crop_err:
            print(f">>> Warning: Failed to generate rabbit crop: {crop_err}")
            rabbit_crop = None

    # Server-side debug logging
    print("--------------------------------------------------")
    print(f">>> DIAGNOSTIC: YOLO Rabbit Detected: {yolo_rabbit}")
    print(f">>> DIAGNOSTIC: YOLO Rabbit Confidence: {best_rabbit_conf if yolo_rabbit else 'N/A'}")
    print(f">>> DIAGNOSTIC: Rabbit Bounding Box: {best_rabbit_box}")
    print(f">>> DIAGNOSTIC: Rabbit Crop Dimensions: {crop_dimensions}")
    print(f">>> DIAGNOSTIC: YOLO Jackfruit Detected: {yolo_jackfruit} (conf: {yolo_jackfruit_conf:.2f})")
    print("--------------------------------------------------")

    # 3. Multimodal scene understanding with Gemini (Full scene + Rabbit crop)
    gemini_data = evaluate_scene_with_gemini(image, rabbit_crop=rabbit_crop)

    # 4. Strict Type Validation & Fusion
    jackfruit_detected = bool(yolo_jackfruit or safe_bool(gemini_data.get("jackfruit_detected"), False))
    rabbit_detected = bool(yolo_rabbit or safe_bool(gemini_data.get("rabbit_detected"), False))

    raw_is_wild = safe_bool(gemini_data.get("is_wild"), False)
    raw_rabbit_type = str(gemini_data.get("rabbit_type", "none")).strip().lower()
    if raw_rabbit_type not in ("wild", "domestic", "none"):
        raw_rabbit_type = "none"
    wild_assessment = str(gemini_data.get("wild_assessment", "")).strip().lower()
    wild_conf = float(gemini_data.get("wild_confidence", 0.0))

    raw_is_unresponsive = safe_bool(gemini_data.get("is_unresponsive"), False)
    unresp_conf = float(gemini_data.get("unresponsive_confidence", 0.0))

    # 5. Enforce Consistency Rules
    if not rabbit_detected:
        rabbit_type = "none"
        is_wild = False
        is_unresponsive = False
    else:
        # Conservative wild classification:
        # Must NOT be uncertain, must have confident evidence (>= 0.50), and must not be marked domestic
        if wild_assessment == "uncertain" or wild_conf < 0.50:
            is_wild = False
            rabbit_type = "domestic" if raw_rabbit_type == "domestic" else "none"
        elif raw_rabbit_type == "wild" and raw_is_wild and wild_conf >= 0.50:
            is_wild = True
            rabbit_type = "wild"
        elif raw_rabbit_type == "domestic" or not raw_is_wild:
            is_wild = False
            rabbit_type = "domestic"
        else:
            is_wild = False
            rabbit_type = "none"

        # Unresponsive status:
        if unresp_conf < 0.50:
            is_unresponsive = False
        else:
            is_unresponsive = raw_is_unresponsive

    # Secondary Consistency Safeguards
    if rabbit_type == "wild":
        is_wild = True
    elif rabbit_type in ("domestic", "none"):
        is_wild = False

    # Debug log Gemini results
    print(f">>> DIAGNOSTIC: Gemini Wild Classification: is_wild={is_wild}, rabbit_type={rabbit_type}, wild_conf={wild_conf:.2f}")
    print(f">>> DIAGNOSTIC: Gemini Unresponsive: is_unresponsive={is_unresponsive}, unresp_conf={unresp_conf:.2f}")

    # 6. Forensic Notes
    notes = str(gemini_data.get("clinical_notes", "")).strip()
    if not notes:
        wild_ev = str(gemini_data.get("wild_evidence", "")).strip()
        unresp_ev = str(gemini_data.get("unresponsive_evidence", "")).strip()
        parts = [p for p in [wild_ev, unresp_ev] if p]
        notes = " ".join(parts) if parts else "Scene visual analysis executed."

    # 7. Canonical Proverb Matrix (Preserving exact 100/75/65/45/30/25/0 scores and commentaries)
    if jackfruit_detected and rabbit_detected and is_unresponsive:
        if is_wild:
            match_score = 100
            verdict = "TRUE"
            commentary = "Sambhavam Sathyam! Asalu kattu muyal chathu, chakka veenu. Canonical accident confirmed!"
        else:
            match_score = 75
            verdict = "FALSE"
            commentary = "Ithu veetile valarthu muyal aanu bro! Proverb requires genuine wild 'kattu muyal'. Disqualified!"
    elif jackfruit_detected and rabbit_detected and not is_unresponsive:
        match_score = 65
        verdict = "FALSE"
        commentary = "Muyal alive aanu bro! Chakka miss aayi, muyal thullichadi nadakkunnu."
    elif rabbit_detected and not jackfruit_detected:
        if is_unresponsive:
            match_score = 45
            verdict = "FALSE"
            commentary = "Muyal chathu, pakshe chakka evide? Suspicious death! Likely natural causes or foul play, not a jackfruit incident."
        else:
            match_score = 25
            verdict = "FALSE"
            commentary = "Chumma oru muyal nadannu pokunnu. Weapon of mass destruction (chakka) missing entirely!"
    elif jackfruit_detected and not rabbit_detected:
        match_score = 30
        verdict = "FALSE"
        commentary = "Chakka veenu, pakshe muyal escape aayi! Scene calm aanu."
    else:
        match_score = 0
        verdict = "FALSE"
        commentary = "Ithil chakkem illa muyalum illa. Enthina veruthe upload cheythe?"

    return {
        "jackfruit_detected": jackfruit_detected,
        "rabbit_detected": rabbit_detected,
        "is_wild": is_wild,
        "rabbit_type": rabbit_type,
        "is_unresponsive": is_unresponsive,
        "match_score": match_score,
        "verdict": verdict,
        "commentary": commentary,
        "forensic_notes": notes
    }

# Mount the static frontend
# Note: This must be defined LAST so it acts as a catch-all route, 
# ensuring it doesn't override the /api/ routes above.
if os.path.isdir("dist"):
    app.mount("/", StaticFiles(directory="dist", html=True), name="static")