import os
import io
import json
import time
import traceback
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from ultralytics import YOLO
from google import genai
from google.genai import types

app = FastAPI(title="ChakkaCheck API", version="1.4.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = "best.pt"
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

try:
    yolo_model = YOLO(MODEL_PATH)
except Exception as e:
    raise RuntimeError(f"Failed to load YOLO model: {e}")

client = genai.Client(api_key=GEMINI_API_KEY)


def evaluate_scene_with_gemini(image: Image.Image) -> dict:
    """Evaluates the scene using Gemini 3.6 Flash with automated 429 rate-limit backoff."""
    prompt = """
    You are an expert veterinary and botanical forensic analyst verifying the Kerala folklore scenario: 'Chakka veenu muyal chathu' (A jackfruit fell, a rabbit died).

    Analyze the entire image and evaluate:
    1. jackfruit_detected: Is a jackfruit (Artocarpus heterophyllus) present on the ground? (true/false)
    2. rabbit_detected: Is a rabbit or wild hare present? (true/false)
    3. is_wild: Is it a wild hare / kattu muyal (agouti/brown/grey coat) or a domestic pet rabbit (e.g., pure white, pet breed)? (true if wild, false if domestic)
    4. rabbit_type: "wild" or "domestic" or "none"
    5. is_unresponsive: Does the rabbit display clear indicators of being unresponsive / dead / incapacitated (e.g., lateral recumbency / lying flat on side, limp posture, closed eyes)? (true/false)
    6. clinical_notes: Concise 1-sentence description of the visual findings.

    Return ONLY a valid JSON object matching this schema:
    {
      "jackfruit_detected": true,
      "rabbit_detected": true,
      "is_wild": true,
      "rabbit_type": "wild",
      "is_unresponsive": true,
      "clinical_notes": "A wild hare is lying in lateral recumbency beside an impacted jackfruit."
    }
    """

    safety_settings = [
        types.SafetySetting(category=types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold=types.HarmBlockThreshold.BLOCK_ONLY_HIGH),
        types.SafetySetting(category=types.HarmCategory.HARM_CATEGORY_HARASSMENT, threshold=types.HarmBlockThreshold.BLOCK_ONLY_HIGH),
        types.SafetySetting(category=types.HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold=types.HarmBlockThreshold.BLOCK_ONLY_HIGH),
        types.SafetySetting(category=types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold=types.HarmBlockThreshold.BLOCK_ONLY_HIGH),
    ]

    # Retry loop with backoff for 429 Resource Exhausted / Rate Limits
    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model="gemini-3.6-flash",
                contents=[prompt, image],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    safety_settings=safety_settings
                )
            )
            parsed = json.loads(response.text.strip())
            print(">>> GEMINI ANALYSIS:", parsed)
            return parsed
        except Exception as err:
            err_str = str(err)
            if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                sleep_duration = 5 * (attempt + 1)
                print(f">>> Rate limited (attempt {attempt + 1}). Pausing for {sleep_duration}s...")
                time.sleep(sleep_duration)
                continue

            print(">>> GEMINI ERROR:", err)
            traceback.print_exc()
            return {
                "jackfruit_detected": False,
                "rabbit_detected": False,
                "is_wild": False,
                "rabbit_type": "none",
                "is_unresponsive": False,
                "clinical_notes": f"Gemini error: {err_str}"
            }

    return {
        "jackfruit_detected": False,
        "rabbit_detected": False,
        "is_wild": False,
        "rabbit_type": "none",
        "is_unresponsive": False,
        "clinical_notes": "API rate limit reached. Please wait a moment and re-upload."
    }


@app.get("/")
def health_check():
    return {"status": "ok", "project": "ChakkaCheck"}


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
    yolo_results = yolo_model(image, conf=0.10)[0]

    yolo_jackfruit = False
    yolo_rabbit = False

    for box in yolo_results.boxes:
        cls_id = int(box.cls[0])
        cls_name = yolo_results.names[cls_id].lower()
        conf = float(box.conf[0])
        print(f">>> YOLO: {cls_name} (class {cls_id}) - conf: {conf:.2f}")

        if "jackfruit" in cls_name or cls_id == 0:
            yolo_jackfruit = True
        elif "rabbit" in cls_name or cls_id == 1:
            yolo_rabbit = True

    # 2. Multimodal scene understanding with Gemini
    gemini_data = evaluate_scene_with_gemini(image)

    # Combine detections: YOLO or Gemini confirmation
    jackfruit_detected = yolo_jackfruit or gemini_data.get("jackfruit_detected", False)
    rabbit_detected = yolo_rabbit or gemini_data.get("rabbit_detected", False)
    is_unresponsive = gemini_data.get("is_unresponsive", False)
    is_wild = gemini_data.get("is_wild", True)
    rabbit_type = gemini_data.get("rabbit_type", "wild" if is_wild else "domestic")
    notes = gemini_data.get("clinical_notes", "")

    # 3. Canonical Proverb Matrix
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