from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
from fastapi.middleware.cors import CORSMiddleware
import logging
from typing import Any, List, Dict
from database import ConversationDB

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

# Database instance
db = ConversationDB()

class ChatRequest(BaseModel):
    message: str
    session_id: str
    user_id: str


class ChatResponse(BaseModel):
    success: bool
    reply: str
    intent_category: str = "unknown"
    steps: List[dict] = []


def parse_llm_response_for_steps(response_text: str) -> List[dict]:
    """Parse LLM response to extract troubleshooting steps with enhanced formatting"""
    steps = []
    
    # Split response into lines
    lines = response_text.split('\n')
    current_step = None
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Check if line starts with step indicator
        if line.lower().startswith(('1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.', 'step')):
            if current_step:
                steps.append(current_step)
                
            # Extract step title and description
            parts = line.split(':', 1)
            if len(parts) > 1:
                title = parts[0].strip()
                description = parts[1].strip()
            else:
                title = line.strip()
                description = ""
                
            current_step = {
                'title': title,
                'description': description,
                'completed': False
            }
        elif current_step and line:
            # Add to description if we have a current step
            if current_step['description']:
                current_step['description'] += ' ' + line
            else:
                current_step['description'] = line
    
    # Add last step if exists
    if current_step:
        steps.append(current_step)
    
    # If no steps found, treat entire response as one step
    if not steps:
        steps.append({
            'title': 'General Troubleshooting',
            'description': response_text,
            'completed': False
        })
    
    return steps


@app.post("/api/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    payload = {
        "model": MODEL_NAME,
        "prompt": f"You are an ISP support agent. The user is reporting: '{req.message}'. Provide troubleshooting steps in a numbered list format. Be concise and clear. Each step should be actionable with specific instructions like 'Open Settings > Network > Click on WiFi' or 'Navigate to Control Panel > Network and Sharing Center'. Do not include markdown formatting.",
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
        
        # Parse steps from the response
        steps = parse_llm_response_for_steps(reply)
        
        # Determine intent category based on keywords
        intent_category = "general_inquiry"
        message_lower = req.message.lower()
        if "not working" in message_lower or "no internet" in message_lower:
            intent_category = "internet_connectivity"
        elif "slow" in message_lower or "speed" in message_lower:
            intent_category = "slow_speed"
        elif "router" in message_lower or "wifi" in message_lower:
            intent_category = "router_issues"
        elif "device" in message_lower or "phone" in message_lower or "computer" in message_lower:
            intent_category = "device_problems"
        
        # Create a simplified greeting message instead of full LLM response
        greeting = "Please follow the steps below to troubleshoot your issue:"
        
        # Log conversation to database
        conversation_id = db.log_conversation(
            req.session_id, 
            req.user_id, 
            req.message, 
            greeting, 
            intent_category,
            steps
        )
        
        return {
            "success": True,
            "reply": greeting,
            "intent_category": intent_category,
            "steps": steps
        }

    except requests.exceptions.RequestException as e:
        logging.exception("Network error when contacting Ollama: %s", e)
        raise HTTPException(status_code=502, detail=f"Failed to contact LLM: {e}")
    except HTTPException:
        # re-raise HTTPExceptions we intentionally raised above
        raise
    except Exception as e:
        logging.exception("Unexpected error in /api/chat: %s", e)
        raise HTTPException(status_code=502, detail="Internal server error")