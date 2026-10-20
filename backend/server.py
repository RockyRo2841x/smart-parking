from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import cv2
import threading
import time

# -------------------- APP --------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------- YOLO MODEL --------------------
model = YOLO("yolov8n.pt")

# 🔴 CHANGE CAMERA INDEX IF NEEDED
# 0 = laptop cam
# 1 / 2 = external webcam
cap = cv2.VideoCapture(1)

# -------------------- AUTO-GENERATE 58 SLOTS --------------------
ROWS = 10
COLS = 6
SLOT_WIDTH = 90
SLOT_HEIGHT = 80
START_X = 40
START_Y = 100
GAP_X = 20
GAP_Y = 20

SLOTS = {}
count = 1

for r in range(ROWS):
    for c in range(COLS):
        if count > 58:
            break

        x1 = START_X + c * (SLOT_WIDTH + GAP_X)
        y1 = START_Y + r * (SLOT_HEIGHT + GAP_Y)
        x2 = x1 + SLOT_WIDTH
        y2 = y1 + SLOT_HEIGHT

        SLOTS[f"B{count}"] = (x1, y1, x2, y2)
        count += 1

    if count > 58:
        break

BIG_LOT_SLOTS = {k: "free" for k in SLOTS}

# -------------------- HELPER FUNCTION --------------------
def overlaps(box, slot):
    bx1, by1, bx2, by2 = box
    sx1, sy1, sx2, sy2 = slot
    return not (bx2 < sx1 or bx1 > sx2 or by2 < sy1 or by1 > sy2)

# -------------------- YOLO DETECTION LOOP --------------------
def yolo_loop():
    global BIG_LOT_SLOTS

    while True:
        ret, frame = cap.read()
        if not ret:
            time.sleep(0.1)
            continue

        results = model(frame, conf=0.4, verbose=False)
        boxes = results[0].boxes

        # Reset all slots to free
        for s in BIG_LOT_SLOTS:
            BIG_LOT_SLOTS[s] = "free"

        if boxes is not None:
            for box, cls in zip(boxes.xyxy, boxes.cls):
                if int(cls) == 2:  # 2 = car in COCO dataset
                    x1, y1, x2, y2 = map(int, box)

                    for slot_id, region in SLOTS.items():
                        if overlaps((x1, y1, x2, y2), region):
                            BIG_LOT_SLOTS[slot_id] = "occupied"

        time.sleep(0.2)

# -------------------- START YOLO THREAD --------------------
threading.Thread(target=yolo_loop, daemon=True).start()

# -------------------- API ROUTES --------------------
@app.get("/")
def root():
    return {"status": "YOLO Parking Backend Running"}

@app.get("/biglot")
def get_big_lot():
    return {"slots": BIG_LOT_SLOTS}

@app.post("/slot/{slot_id}/{state}")
def set_slot(slot_id: str, state: str):
    if slot_id not in BIG_LOT_SLOTS:
        raise HTTPException(status_code=404, detail="Slot not found")
    if state not in ["free", "occupied"]:
        raise HTTPException(status_code=400, detail="Invalid state")

    BIG_LOT_SLOTS[slot_id] = state
    return {"ok": True}