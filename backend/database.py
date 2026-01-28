import json
import os
from datetime import datetime
from typing import List, Dict, Any

class ConversationDB:
    def __init__(self, db_path: str = "conversations.json"):
        self.db_path = db_path
        self.init_db()
    
    def init_db(self):
        """Initialize the JSON database"""
        if not os.path.exists(self.db_path):
            with open(self.db_path, 'w') as f:
                json.dump([], f)
    
    def log_conversation(self, session_id: str, user_id: str, user_message: str, 
                        agent_response: str, intent_category: str = None, steps: List[Dict] = None) -> int:
        """Log a conversation entry and return the conversation ID"""
        # Read existing data
        if os.path.exists(self.db_path):
            with open(self.db_path, 'r') as f:
                conversations = json.load(f)
        else:
            conversations = []
        
        # Create new conversation entry
        conversation_entry = {
            "id": len(conversations) + 1,
            "session_id": session_id,
            "user_id": user_id,
            "timestamp": datetime.now().isoformat(),
            "user_message": user_message,
            "agent_response": agent_response,
            "intent_category": intent_category,
            "steps": steps or []
        }
        
        conversations.append(conversation_entry)
        
        # Write back to file
        with open(self.db_path, 'w') as f:
            json.dump(conversations, f, indent=2)
        
        return conversation_entry["id"]
    
    def log_troubleshooting_steps(self, conversation_id: int, steps: List[Dict]):
        """Log troubleshooting steps for a conversation"""
        # Read existing data
        if os.path.exists(self.db_path):
            with open(self.db_path, 'r') as f:
                conversations = json.load(f)
        else:
            return
        
        # Find the conversation and update steps
        for conv in conversations:
            if conv["id"] == conversation_id:
                conv["steps"] = steps
                break
        
        # Write back to file
        with open(self.db_path, 'w') as f:
            json.dump(conversations, f, indent=2)
    
    def mark_step_complete(self, conversation_id: int, step_index: int):
        """Mark a troubleshooting step as complete"""
        # Read existing data
        if os.path.exists(self.db_path):
            with open(self.db_path, 'r') as f:
                conversations = json.load(f)
        else:
            return
        
        # Find the conversation and mark step as complete
        for conv in conversations:
            if conv["id"] == conversation_id and step_index < len(conv.get("steps", [])):
                conv["steps"][step_index]["completed"] = True
                break
        
        # Write back to file
        with open(self.db_path, 'w') as f:
            json.dump(conversations, f, indent=2)
    
    def get_conversation_history(self, session_id: str) -> List[Dict]:
        """Retrieve conversation history for a session"""
        if os.path.exists(self.db_path):
            with open(self.db_path, 'r') as f:
                conversations = json.load(f)
            
            # Filter by session_id
            return [conv for conv in conversations if conv["session_id"] == session_id]
        
        return []