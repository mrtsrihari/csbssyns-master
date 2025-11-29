import os

# Optimize TensorFlow startup
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_FORCE_GPU_ALLOW_GROWTH'] = 'true'

import warnings
warnings.filterwarnings('ignore')

import cv2
import numpy as np
from keras.models import load_model

print("Loading model...")

# ------------------------------
# Load pretrained XCEPTION model
# ------------------------------
model_path = "fer2013_mini_XCEPTION.102-0.66.hdf5"

# Check if model file exists
if not os.path.exists(model_path):
    print(f"❌ ERROR: Model file not found: {model_path}")
    print(f"Current directory: {os.getcwd()}")
    exit(1)

try:
    emotion_model = load_model(model_path, compile=False)
    print("✓ Model loaded successfully!")
except Exception as e:
    print(f"❌ ERROR loading model: {e}")
    exit(1)

# Emotion labels (FER2013)
emotion_labels = ['Angry','Disgust','Fear','Happy','Sad','Surprise','Neutral']

# ------------------------------
# Initialize OpenCV Face Detector
# ------------------------------
face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

if face_cascade.empty():
    print("❌ ERROR: Could not load face cascade classifier")
    exit(1)

# ------------------------------
# Start webcam
# ------------------------------
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("❌ ERROR: Could not access webcam")
    exit(1)

print("\nReal-time emotion detection running...")
print("Press 'q' to quit.\n")

while True:
    ret, frame = cap.read()
    if not ret:
        break

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # Detect faces
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5)

    for (x, y, w, h) in faces:
        # Draw face rectangle
        cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 255), 2)

        # Preprocess face ROI
        roi_gray = gray[y:y + h, x:x + w]
        roi_gray = cv2.resize(roi_gray, (64, 64))  # model input size
        roi_gray = roi_gray.astype("float32") / 255.0
        roi_gray = np.expand_dims(roi_gray, axis=0)
        roi_gray = np.expand_dims(roi_gray, axis=-1)

        # Predict emotion
        prediction = emotion_model.predict(roi_gray, verbose=0)
        emotion = emotion_labels[np.argmax(prediction)]

        # Display emotion label
        cv2.putText(frame, emotion, (x, y - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (36, 255, 12), 2)

    cv2.imshow("Real-Time Emotion Detection", frame)

    # Quit
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()
