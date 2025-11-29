# chatbot.py
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
from datetime import datetime, timezone, timedelta
from itsdangerous import URLSafeTimedSerializer, SignatureExpired

# Flask app
app = Flask(_name_)
CORS(app)

# Load .env
load_dotenv()

# REQUIRED env var
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables")

# Initialize GenAI client
client = genai.Client(api_key=API_KEY)

# Default live model + config for Gemini Live audio responses
model = "gemini-live-2.5-flash-preview"
config = {
    "response_modalities": ["AUDIO"],
    "speech_config": types.SpeechConfig(
        voice_config=types.VoiceConfig(
            prebuilt_voice_config=types.PrebuiltVoiceConfig(
                voice_name="LEDA"
            )
        )
    ),
    "system_instruction": (
        "You are a professional mock interviewer. Conduct realistic, adaptive interview "
        "simulations. Ask challenging and relevant questions, provide feedback, and adjust "
        "difficulty based on responses. Keep the tone professional, constructive, and supportive."
    )
}
BASE_SYSTEM_INSTRUCTION = config.get("system_instruction", "")

# Audio buffer + thread-safety
audio_buffer = np.array([], dtype=np.int16)
buffer_lock = threading.Lock()

# Audio queues (larger max sizes to avoid drop)
audio_input_queue = Queue(maxsize=100)
audio_output_queue = Queue(maxsize=200)

# Audio output callback for sounddevice OutputStream
def audio_output_callback(outdata, frames, time_info, status):
    """Play audio data from the output buffer. Filled by receive_audio."""
    global audio_buffer
    if status:
        print(f"Output status: {status}")
    with buffer_lock:
        # Fill buffer from queue if needed
        while not audio_output_queue.empty() and len(audio_buffer) < frames * 4:
            try:
                chunk = audio_output_queue.get_nowait()
                audio_buffer = np.append(audio_buffer, chunk)
            except Exception:
                break
        # If enough frames, output; else pad with silence
        if len(audio_buffer) >= frames:
            outdata[:, 0] = audio_buffer[:frames]
            audio_buffer = audio_buffer[frames:]
        else:
            if len(audio_buffer) > 0:
                available = len(audio_buffer)
                outdata[:available, 0] = audio_buffer
                outdata[available:, 0] = 0
                audio_buffer = np.array([], dtype=np.int16)
            else:
                outdata.fill(0)

# Audio input callback for sounddevice InputStream
def audio_input_callback(indata, frames, time_info, status):
    if status:
        print(f"Input status: {status}")
    try:
        audio_input_queue.put(indata.copy(), block=False)
    except Exception:
        # Queue full — drop this chunk
        pass

# Async: Send captured audio chunks to Gemini Live session
async def send_audio(session, stop_event):
    print("🎤 Listening... (Press stop to end)")
    try:
        while not stop_event.is_set():
            try:
                if not audio_input_queue.empty():
                    audio_chunk = audio_input_queue.get(timeout=0.01)
                    # send audio as raw PCM blob
                    await session.send_realtime_input(
                        audio=types.Blob(
                            data=audio_chunk.tobytes(),
                            mime_type="audio/pcm;rate=16000"
                        )
                    )
                else:
                    await asyncio.sleep(0.01)
            except Exception as e:
                if not stop_event.is_set():
                    print(f"Error in send loop: {e}")
                    await asyncio.sleep(0.1)
    except asyncio.CancelledError:
        print("Send task cancelled")
    except Exception as e:
        print(f"Fatal error in send_audio: {e}")

# Async: Receive continuous audio and server_content events from Gemini Live
async def receive_audio(session, stop_event):
    """Receive audio chunks and server content from Gemini Live connection."""
    turn_count = 0
    try:
        while not stop_event.is_set():
            async for response in session.receive():
                if stop_event.is_set():
                    break
                # Audio blob bytes (if present)
                if response.data is not None:
                    # convert bytes -> int16 numpy array
                    audio_data = np.frombuffer(response.data, dtype=np.int16)
                    audio_output_queue.put(audio_data)
                # Handle server_content (turn complete & transcription available)
                if response.server_content:
                    if getattr(response.server_content, "turn_complete", False):
                        turn_count += 1
                        print(f"✅ Turn {turn_count} complete - evaluating response...")
                        user_response = getattr(response.server_content, "input_transcription", None)
                        feedback = "No feedback available."
                        if user_response:
                            feedback = evaluate_response(user_response)
                            print(f"📝 Feedback: {feedback}")
                        print("🔄 Preparing next question...")
                        adjust_difficulty(turn_count, feedback)
                        print(f"✅ Turn {turn_count} complete - ready for next input!")
            if stop_event.is_set():
                break
            # Loop ended unexpectedly — wait a bit and continue
            print("⚠  Session receive loop ended, waiting...")
            await asyncio.sleep(0.5)
    except asyncio.CancelledError:
        print("Receive task cancelled")
    except Exception as e:
        if not stop_event.is_set():
            print(f"Fatal error receiving audio: {e}")

# Simple prompt for getting JD from CLI (helper only)
def get_job_description_cli():
    print("📄 Please provide the Job Description (JD) for the interview:")
    jd = input("Enter JD or path to JD file: ").strip()
    if os.path.isfile(jd):
        with open(jd, "r") as f:
            return f.read()
    return jd

# Placeholder evaluation logic — replace with a smarter evaluator if desired
def evaluate_response(user_response):
    """Return short human-like feedback on the user's spoken answer."""
    text = (user_response or "").lower()
    if "good" in text or "well" in text:
        return "Great response! Keep it up."
    elif "bad" in text or "not" in text:
        return "Consider elaborating more on your answer."
    else:
        return "Good effort! Try to be more specific."

# Simple difficulty adjuster (placeholder)
def adjust_difficulty(turn_count, feedback):
    if "Great" in feedback:
        print("🔼 Increasing difficulty for the next question.")
    elif "Consider" in feedback:
        print("🔽 Lowering difficulty for the next question.")
    else:
        print("➡ Keeping difficulty the same.")

# Thread control globals
interview_lock = threading.Lock()
interview_thread_running = False
interview_stop_event = None

def run_interview_session(job_description):
    """
    Start a background thread that connects to Gemini Live and streams audio.
    Returns an acknowledgement or None if a session is already running.
    """
    global interview_thread_running, interview_stop_event

    # Avoid mutating global config in-place for each session
    session_config = dict(config)
    session_config["system_instruction"] = (
        f"{BASE_SYSTEM_INSTRUCTION} Use the following Job Description (JD) as context:\n{job_description}"
    )

    def interview_thread():
        global interview_thread_running, interview_stop_event
        interview_stop_event = asyncio.Event()
        input_stream = None
        output_stream = None

        async def interview():
            nonlocal input_stream, output_stream
            try:
                # Connect to Gemini Live via async context manager
                async with client.aio.live.connect(model=model, config=session_config) as session:
                    print("✅ Connected to Gemini Live API")
                    # Input and output streams
                    input_stream = sd.InputStream(
                        channels=1,
                        samplerate=16000,
                        dtype=np.int16,
                        callback=audio_input_callback,
                        blocksize=1024
                    )
                    output_stream = sd.OutputStream(
                        channels=1,
                        samplerate=24000,
                        dtype=np.int16,
                        callback=audio_output_callback,
                        blocksize=2048
                    )
                    input_stream.start()
                    output_stream.start()
                    print("🎙  Audio streams started\n")
                    send_task = asyncio.create_task(send_audio(session, interview_stop_event))
                    receive_task = asyncio.create_task(receive_audio(session, interview_stop_event))
                    # Wait until stop_event is set
                    while not interview_stop_event.is_set():
                        await asyncio.sleep(0.05)
                    # Stop streams
                    if input_stream:
                        input_stream.stop()
                        input_stream.close()
                    if output_stream:
                        output_stream.stop()
                        output_stream.close()
                    # Cancel tasks and wait
                    send_task.cancel()
                    receive_task.cancel()
                    await asyncio.gather(send_task, receive_task, return_exceptions=True)
            except Exception as e:
                print(f"\n❌ Error in interview session: {e}")
            finally:
                interview_stop_event.set()

        # Run the async interview loop in this thread
        asyncio.run(interview())
        # cleanup flag
        with interview_lock:
            interview_thread_running = False
            interview_stop_event = None

    with interview_lock:
        if interview_thread_running:
            return None
        interview_thread_running = True

    thread = threading.Thread(target=interview_thread, daemon=True)
    thread.start()
    return "Interview session started in background."

def extract_pdf_text(pdf_path):
    """Extract text from a PDF file using pdfplumber (used if you feed PDFs)."""
    text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        logging.error(f"Error extracting PDF text: {e}")
    return text.strip()

# Endpoint: start interview session (POST { "jd": "<job description text>" })
@app.route("/interview", methods=["POST"])
def interview_route():
    data = request.get_json() or {}
    job_description = data.get("jd")
    if not job_description:
        return jsonify({"error": "No JD provided."}), 400
    result = run_interview_session(job_description)
    if result is None:
        return jsonify({"error": "Interview session already running. Please stop it first."}), 409
    return jsonify({"result": result})

# Endpoint: stop interview
@app.route("/stop-interview", methods=["POST"])
def stop_interview_route():
    global interview_stop_event, interview_thread_running, audio_buffer
    with interview_lock:
        if interview_thread_running and interview_stop_event:
            interview_stop_event.set()
            # Clear queues and buffer
            while not audio_input_queue.empty():
                try:
                    audio_input_queue.get_nowait()
                except Exception:
                    break
            while not audio_output_queue.empty():
                try:
                    audio_output_queue.get_nowait()
                except Exception:
                    break
            audio_buffer = np.array([], dtype=np.int16)
            return jsonify({"result": "Interview stopped and state reset."})
        else:
            return jsonify({"error": "No interview session running."}), 409

# Endpoint: generate structured interviewer questions using Gemini text generation
@app.route("/generate-questions", methods=["POST"])
def generate_questions():
    data = request.get_json() or {}
    company = data.get("company_name")
    role = data.get("role")
    domain = data.get("domain")
    experience = data.get("experience_level")
    qtype = data.get("question_type")
    difficulty = data.get("difficulty")
    num_q = data.get("num_questions", 15)

    if not (company and role and domain and experience and qtype and difficulty):
        return jsonify({"error": "Missing required fields"}), 400

    prompt = f"""
You are an expert interviewer. Generate {num_q} unique interview questions.
Company: {company}
Role: {role}
Domain: {domain}
Experience Level: {experience}
Question Type: {qtype}
Difficulty: {difficulty}

For each question, return a JSON object with:
- id: a unique number
- question: the actual question text
- answer: a clear and concise correct answer
- explanation: a short explanation or reasoning behind the answer

Return ONLY a valid JSON array.
"""

    # Use the REST text generation endpoint for Gemini (fallback)
    model_name = "gemini-2.5-flash"
    payload = {"contents": [{"parts": [{"text": prompt}]}]}

    try:
        resp = requests.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={API_KEY}",
            json=payload,
            timeout=60
        )
        resp.raise_for_status()
        resp_json = resp.json()
        candidates = resp_json.get("candidates", [])
        if not candidates:
            return jsonify({"error": "No candidates returned from Gemini", "raw": resp_json}), 500
        text = candidates[0]["content"]["parts"][0]["text"].strip()

        # Clean fences / control characters
        import re
        if text.startswith(""):
            text = re.sub(r"^[a-zA-Z]*", "", text).replace("```", "").strip()
        text = re.sub(r"[\x00-\x1F]+", "", text)

        questions_list = json.loads(text)
    except Exception as e:
        # Return helpful debug info
        return jsonify({"error": f"Failed to parse Gemini response: {e}", "raw": (resp.text if 'resp' in locals() else None)}), 500

    return jsonify({
        "company": company,
        "role": role,
        "domain": domain,
        "experience_level": experience,
        "question_type": qtype,
        "difficulty": difficulty,
        "questions": questions_list
    })

# If run directly, start Flask dev server
if _name_ == "_main_":
    app.run(debug=True, host="0.0.0.0", port=int(os.getenv("PORT", "5000")))