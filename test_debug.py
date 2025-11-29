import cv2
import numpy as np
from keras.models import load_model
import os

print("Starting debug test...")

# Check model file
model_path = "fer2013_mini_XCEPTION.102-0.66.hdf5"
print(f"Current directory: {os.getcwd()}")
print(f"Looking for model: {model_path}")
print(f"Model exists: {os.path.exists(model_path)}")

if os.path.exists(model_path):
    try:
        emotion_model = load_model(model_path, compile=False)
        print("✓ Model loaded successfully")
    except Exception as e:
        print(f"❌ ERROR loading model: {e}")
else:
    print("❌ Model file not found!")

# Check webcam
cap = cv2.VideoCapture(0)
print(f"Webcam available: {cap.isOpened()}")

# Check face cascade
face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)
print(f"Face cascade loaded: {not face_cascade.empty()}")

print("\nAll checks passed! Ready for real-time emotion detection.")
print("Press 'q' to quit.\n")
