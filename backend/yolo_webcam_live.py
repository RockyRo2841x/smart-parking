from ultralytics import YOLO
import cv2
# Parking slot rectangles (x1, y1, x2, y2)
# These are ROUGH for now – you’ll fine-tune later
SLOTS = {
    "B1": (50, 200, 150, 300),
    "B2": (160, 200, 260, 300),
    "B3": (270, 200, 370, 300),

    "B4": (50, 320, 150, 420),
    "B5": (160, 320, 260, 420),
    "B6": (270, 320, 370, 420),
}
def iou(boxA, boxB):
    xA = max(boxA[0], boxB[0])
    yA = max(boxA[1], boxB[1])
    xB = min(boxA[2], boxB[2])
    yB = min(boxA[3], boxB[3])

    inter_width = max(0, xB - xA)
    inter_height = max(0, yB - yA)
    inter_area = inter_width * inter_height

    boxA_area = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1])
    boxB_area = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1])

    union_area = boxA_area + boxB_area - inter_area

    if union_area == 0:
        return 0

    return inter_area / union_area

# 🔒 External webcam index (keep 1 unless proven otherwise)
CAMERA_INDEX = 1

model = YOLO("yolov8n.pt")

# 🚨 FORCE DIRECTSHOW (THIS IS THE FIX)
cap = cv2.VideoCapture(CAMERA_INDEX, cv2.CAP_DSHOW)

# Optional: force resolution (helps some webcams)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

if not cap.isOpened():
    print("❌ Cannot open camera", CAMERA_INDEX)
    exit()

print("✅ External camera locked on index", CAMERA_INDEX)
print("Press Q to quit")

while True:
    ret, frame = cap.read()
    if not ret:
        print("❌ Frame read failed")
        break

    results = model(frame, conf=0.25, classes=[2])  # class 2 = car
    annotated = results[0].plot()

    cv2.imshow("YOLO External Camera", annotated)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()
