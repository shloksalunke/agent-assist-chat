import sqlite3
from datetime import datetime
from typing import List, Tuple

class ConversationDB:
    def __init__(self, db_path: str = "conversations.db"):
        self.db_path = db_path
        self.init_db()
    
    def init_db(self):
        """Initialize the database with required tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create conversations table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                user_id TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                user_message TEXT,
                agent_response TEXT,
                intent_category TEXT
            )
        """)
        
        # Create troubleshooting_steps table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS troubleshooting_steps (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id INTEGER,
                step_order INTEGER,
                step_title TEXT,
                step_description TEXT,
                completed BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (conversation_id) REFERENCES conversations (id)
            )
        """)
        
        conn.commit()
        conn.close()
    
    def log_conversation(self, session_id: str, user_id: str, user_message: str, 
                        agent_response: str, intent_category: str = None) -> int:
        """Log a conversation entry and return the conversation ID"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO conversations 
            (session_id, user_id, user_message, agent_response, intent_category)
            VALUES (?, ?, ?, ?, ?)
        """, (session_id, user_id, user_message, agent_response, intent_category))
        
        conversation_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return conversation_id
    
    def log_troubleshooting_steps(self, conversation_id: int, steps: List[dict]):
        """Log troubleshooting steps for a conversation"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        for i, step in enumerate(steps):
            cursor.execute("""
                INSERT INTO troubleshooting_steps 
                (conversation_id, step_order, step_title, step_description)
                VALUES (?, ?, ?, ?)
            """, (conversation_id, i+1, step.get('title', ''), step.get('description', '')))
        
        conn.commit()
        conn.close()
    
    def mark_step_complete(self, step_id: int):
        """Mark a troubleshooting step as complete"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE troubleshooting_steps 
            SET completed = TRUE 
            WHERE id = ?
        """, (step_id,))
        
        conn.commit()
        conn.close()
    
    def get_conversation_history(self, session_id: str) -> List[Tuple]:
        """Retrieve conversation history for a session"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT * FROM conversations 
            WHERE session_id = ? 
            ORDER BY timestamp ASC
        """, (session_id,))
        
        history = cursor.fetchall()
        conn.close()
        
        return history

# Initialize the database
db = ConversationDB()