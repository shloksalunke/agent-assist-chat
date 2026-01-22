from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
from fastapi.middleware.cors import CORSMiddleware

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
        r.raise_for_status()

        answer = r.json().get("response", "")

        return {
            "success": True,
            "reply": answer
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
