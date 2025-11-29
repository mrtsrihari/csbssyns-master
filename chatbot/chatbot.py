import asyncio
import logging
import sounddevice as sd
import numpy as np
from google import genai
from google.genai import types
import os
from queue import Queue
import threading
from dotenv import load_dotenv
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
import time
import math
import tempfile
import pdfplumber
import json
from datetime import datetime

# ---------------------------------------------
# FLASK APP
# ---------------------------------------------
app = Flask(__name__)
CORS(app)

# Load env from parent directory (.env at workspace root)
env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
load_dotenv(dotenv_path=env_path)

API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise ValueError("❌ GEMINI_API_KEY missing in .env")

# Gemini Client
client = genai.Client(api_key=API_KEY)

# Default Gemini Live config
model = "gemini-live-2.5-flash-preview"
config = {
    "response_modalities": ["AUDIO"],
    "speech_config": types.SpeechConfig(
        voice_config=types.VoiceConfig(
            prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name="LEDA")
        )
    ),
    "system_instruction": (
        "You are a professional mock interviewer. Conduct realistic, adaptive interview "
        "simulations. Ask challenging and relevant questions and give feedback."
    )
}
BASE_SYSTEM_INSTRUCTION = config["system_instruction"]

# ---------------------------------------------
# AUDIO BUFFERS & STREAMING
# ---------------------------------------------
audio_buffer = np.array([], dtype=np.int16)
buffer_lock = threading.Lock()

audio_input_queue = Queue(maxsize=100)
audio_output_queue = Queue(maxsize=200)

def audio_output_callback(outdata, frames, time_info, status):
    global audio_buffer
    if status:
        print(f"Output status: {status}")

    with buffer_lock:
        while not audio_output_queue.empty() and len(audio_buffer) < frames * 4:
            try:
                chunk = audio_output_queue.get_nowait()
                audio_buffer = np.append(audio_buffer, chunk)
            except:
                break

        if len(audio_buffer) >= frames:
            outdata[:, 0] = audio_buffer[:frames]
            audio_buffer = audio_buffer[frames:]
        else:
            if len(audio_buffer) > 0:
                size = len(audio_buffer)
                outdata[:size, 0] = audio_buffer
                outdata[size:, 0] = 0
                audio_buffer = np.array([], dtype=np.int16)
            else:
                outdata.fill(0)


def audio_input_callback(indata, frames, time_info, status):
    if status:
        print(f"Input status: {status}")
    try:
        audio_input_queue.put(indata.copy(), block=False)
    except:
        pass

# ---------------------------------------------
# STREAM SENDER
# ---------------------------------------------
async def send_audio(session, stop_event):
    while not stop_event.is_set():
        try:
            if not audio_input_queue.empty():
                chunk = audio_input_queue.get()
                await session.send_realtime_input(
                    audio=types.Blob(
                        data=chunk.tobytes(),
                        mime_type="audio/pcm;rate=16000"
                    )
                )
            else:
                await asyncio.sleep(0.01)
        except:
            pass

# ---------------------------------------------
# STREAM RECEIVER
# ---------------------------------------------
async def receive_audio(session, stop_event):
    while not stop_event.is_set():
        async for response in session.receive():
            if response.data:
                arr = np.frombuffer(response.data, dtype=np.int16)
                audio_output_queue.put(arr)

# ---------------------------------------------
# START INTERVIEW THREAD
# ---------------------------------------------
interview_lock = threading.Lock()
interview_thread_running = False
interview_stop_event = None

def run_interview_session(job_description):
    global interview_thread_running, interview_stop_event

    session_config = dict(config)
    session_config["system_instruction"] = (
        f"{BASE_SYSTEM_INSTRUCTION}\n\n"
        f"Job Description:\n{job_description}"
    )

    def interview_thread():
        global interview_thread_running, interview_stop_event

        interview_stop_event = asyncio.Event()

        async def run():
            try:
                async with client.aio.live.connect(model=model, config=session_config) as session:
                    print("🎤 Connected to Gemini Live")

                    input_stream = sd.InputStream(
                        channels=1, samplerate=16000, dtype=np.int16,
                        callback=audio_input_callback
                    )
                    output_stream = sd.OutputStream(
                        channels=1, samplerate=24000, dtype=np.int16,
                        callback=audio_output_callback
                    )

                    input_stream.start()
                    output_stream.start()

                    send_task = asyncio.create_task(send_audio(session, interview_stop_event))
                    recv_task = asyncio.create_task(receive_audio(session, interview_stop_event))

                    while not interview_stop_event.is_set():
                        await asyncio.sleep(0.05)

                    input_stream.stop(); input_stream.close()
                    output_stream.stop(); output_stream.close()

                    send_task.cancel(); recv_task.cancel()
            except Exception as e:
                print("❌ Error:", e)

        asyncio.run(run())

        with interview_lock:
            interview_thread_running = False

    with interview_lock:
        if interview_thread_running:
            return None
        interview_thread_running = True

    threading.Thread(target=interview_thread, daemon=True).start()
    return "Interview session started!"

# ---------------------------------------------
# PDF Extract
# ---------------------------------------------
def extract_pdf_text(path):
    text = ""
    with pdfplumber.open(path) as pdf:
        for p in pdf.pages:
            t = p.extract_text()
            if t:
                text += t + "\n"
    return text.strip()

# ---------------------------------------------
# API ENDPOINTS
# ---------------------------------------------

@app.route("/interview", methods=["POST"])
def route_interview():
    jd = (request.get_json() or {}).get("jd")
    if not jd:
        return jsonify({"error": "JD missing"}), 400

    result = run_interview_session(jd)
    if not result:
        return jsonify({"error": "Interview already running"}), 409

    return jsonify({"result": result})


@app.route("/stop-interview", methods=["POST"])
def route_stop():
    global interview_stop_event, interview_thread_running, audio_buffer

    with interview_lock:
        if interview_thread_running and interview_stop_event:
            interview_stop_event.set()
            audio_buffer = np.array([], dtype=np.int16)

            while not audio_input_queue.empty():
                audio_input_queue.get_nowait()

            while not audio_output_queue.empty():
                audio_output_queue.get_nowait()

            return jsonify({"result": "Interview stopped."})

        return jsonify({"error": "No interview running"}), 409


# ---------------------------------------------
# TEXT CHAT (Your new endpoint)
# ---------------------------------------------
@app.route("/text-chat", methods=["POST"])
def text_chat():
    data = request.get_json() or {}
    prompt = data.get("prompt")

    if not prompt:
        return jsonify({"error": "Prompt missing"}), 400

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        return jsonify({"response": response.text})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------------------------------------
# GENERATE QUESTIONS
# ---------------------------------------------
@app.route("/generate-questions", methods=["POST"])
def generate_questions():
    data = request.get_json() or {}

    required = ["company_name", "role", "domain", "experience_level", "question_type", "difficulty"]
    for k in required:
        if not data.get(k):
            return jsonify({"error": f"Missing field: {k}"}), 400

    prompt = f"""
Generate interview questions for:
Company: {data['company_name']}
Role: {data['role']}
Domain: {data['domain']}
Experience: {data['experience_level']}
Type: {data['question_type']}
Difficulty: {data['difficulty']}
Count: {data.get('num_questions', 10)}

Return ONLY JSON array with fields: id, question, answer, explanation.
"""

    try:
        resp = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        json_data = json.loads(resp.text)
        return jsonify(json_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------------------------------------
# RUN FLASK
# ---------------------------------------------
if __name__ == "__main__":
    app.run(debug=True, port=5000)
