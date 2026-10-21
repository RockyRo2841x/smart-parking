"""Parking prototype API. Camera detection is explicitly opt-in."""

from contextlib import asynccontextmanager
import logging
import os
from pathlib import Path
import threading

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

log = logging.getLogger(__name__)
DETECTION_ENABLED = os.getenv("PARKING_DETECTION_ENABLED", "0") == "1"
CAMERA_INDEX = int(os.getenv("PARKING_CAMERA_INDEX", "1"))
MODEL_PATH = os.getenv("PARKING_MODEL_PATH", str(Path(__file__).with_name("yolov8n.pt")))

# Original example geometry: replace these regions with calibrated camera coordinates.
SLOTS = {}
for row in range(10):
    for col in range(6):
        number = row * 6 + col + 1
        if number <= 58:
            x, y = 40 + col * 110, 100 + row * 100
            SLOTS[f"B{number}"] = (x, y, x + 90, y + 80)

BIG_LOT_SLOTS = {key: "free" for key in SLOTS}
state_lock = threading.Lock()
detector_status = "disabled"


def overlaps(box, slot):
    bx1, by1, bx2, by2 = box
    sx1, sy1, sx2, sy2 = slot
    return not (bx2 < sx1 or bx1 > sx2 or by2 < sy1 or by1 > sy2)


def detection_snapshot(boxes):
    """Build a complete frame snapshot before publishing it to API readers."""
    return {
        key: "occupied" if any(overlaps(box, region) for box in boxes) else "free"
        for key, region in SLOTS.items()
    }


def yolo_loop(stop):
    global detector_status
    cap = None
    try:
        import cv2
        from ultralytics import YOLO

        model = YOLO(MODEL_PATH)
        cap = cv2.VideoCapture(CAMERA_INDEX)
        if not cap.isOpened():
            raise RuntimeError("Configured camera could not be opened")
        while not stop.is_set():
            ok, frame = cap.read()
            if not ok:
                detector_status = "camera_unavailable"
                stop.wait(0.2)
                continue
            results = model(frame, conf=0.4, verbose=False)
            boxes = results[0].boxes
            cars = [] if boxes is None else [
                tuple(map(int, box))
                for box, cls in zip(boxes.xyxy, boxes.cls)
                if int(cls) == 2
            ]
            snapshot = detection_snapshot(cars)
            with state_lock:
                BIG_LOT_SLOTS.update(snapshot)
            detector_status = "running"
            stop.wait(0.2)
    except Exception:
        detector_status = "error"
        log.exception("Parking detector stopped; occupancy may be stale")
    finally:
        if cap is not None:
            cap.release()


@asynccontextmanager
async def lifespan(app):
    global detector_status
    stop = threading.Event()
    worker = None
    if DETECTION_ENABLED:
        detector_status = "starting"
        worker = threading.Thread(target=yolo_loop, args=(stop,), daemon=True)
        worker.start()
    yield
    stop.set()
    if worker is not None:
        worker.join(timeout=5)


app = FastAPI(title="Smart Parking Prototype", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)


@app.get("/")
def root():
    return {
        "status": "Parking backend running",
        "mode": "camera" if DETECTION_ENABLED else "manual-demo",
        "detector_status": detector_status,
    }


@app.get("/biglot")
def get_big_lot():
    with state_lock:
        slots = BIG_LOT_SLOTS.copy()
    return {"slots": slots, **root()}


@app.post("/slot/{slot_id}/{state}")
def set_slot(slot_id: str, state: str):
    if slot_id not in BIG_LOT_SLOTS:
        raise HTTPException(status_code=404, detail="Slot not found")
    if state not in ("free", "occupied"):
        raise HTTPException(status_code=400, detail="Invalid state")
    if DETECTION_ENABLED:
        raise HTTPException(status_code=409, detail="Manual updates require manual-demo mode")
    with state_lock:
        BIG_LOT_SLOTS[slot_id] = state
    return {"ok": True}
