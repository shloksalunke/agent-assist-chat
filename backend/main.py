from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
from fastapi.middleware.cors import CORSMiddleware
import logging
from typing import Any

app = FastAPI(
    title="Local LLM API",
    description="FastAPI backend connected to local quantized LLM via Ollama",
    version="1.0"
)

# ✅ ADD THIS (CORS FIX)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # dummy frontend ke liye OK
    allow_credentials=True,
    allow_methods=["*"],        # POST, OPTIONS sab allow
    allow_headers=["*"],
)

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "mistral4bit"


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    success: bool
    reply: str


@app.post("/api/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    payload = {
        "model": MODEL_NAME,
        "prompt": req.message,
        "stream": False
    }

    try:
        r = requests.post(OLLAMA_URL, json=payload, timeout=120)
        # raise for non-2xx status codes
        try:
            r.raise_for_status()
        except requests.exceptions.RequestException as upstream_err:
            logging.error("Ollama returned non-2xx: %s %s", r.status_code, r.text)
            raise HTTPException(status_code=502, detail=f"Upstream LLM error: {upstream_err}")

        # parse json safely
        try:
            data: Any = r.json()
        except ValueError as ve:
            logging.error("Failed to parse JSON from Ollama: %s", r.text)
            raise HTTPException(status_code=502, detail=f"Invalid JSON from LLM: {ve}")

        # Try common response shapes from local LLM proxies
        reply = ""
        if isinstance(data, dict):
            # common key used earlier
            if "response" in data and isinstance(data.get("response"), str):
                reply = data.get("response")
            # some LLM proxies return results array
            elif "results" in data and isinstance(data.get("results"), list) and len(data.get("results")) > 0:
                first = data.get("results")[0]
                if isinstance(first, dict):
                    # try a few plausible keys
                    reply = first.get("content") or first.get("output") or first.get("text") or first.get("response", "")
                else:
                    reply = str(first)
            # some endpoints use 'output' or 'answer'
            elif "output" in data:
                reply = str(data.get("output"))
            elif "answer" in data:
                reply = str(data.get("answer"))
            else:
                # fallback to stringifying whole payload
                reply = str(data)
        else:
            reply = str(data)

        return {
            "success": True,
            "reply": reply
        }

    except requests.exceptions.RequestException as e:
        logging.exception("Network error when contacting Ollama: %s", e)
        raise HTTPException(status_code=502, detail=f"Failed to contact LLM: {e}")
    except HTTPException:
        # re-raise HTTPExceptions we intentionally raised above
        raise
    except Exception as e:
        logging.exception("Unexpected error in /api/chat: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
