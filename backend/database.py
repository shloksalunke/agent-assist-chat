import sqlite3
import os
from datetime import datetime
from typing import List, Dict, Any

class ConversationDB:
    def __init__(self, db_path: str = "conversations.db"):
        self.db_path = db_path
        self.init_db()
    
    def init_db(self):
        """Initialize the SQLite database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create conversations table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                user_message TEXT NOT NULL,
                agent_response TEXT NOT NULL,
                intent_category TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create troubleshooting steps table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS troubleshooting_steps (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id INTEGER NOT NULL,
                step_order INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                completed BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (conversation_id) REFERENCES conversations (id)
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def log_conversation(self, session_id: str, user_id: str, user_message: str, 
                        agent_response: str, intent_category: str = None, steps: List[Dict] = None) -> int:
        """Log a conversation entry and return the conversation ID"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Insert conversation
        cursor.execute('''
            INSERT INTO conversations (session_id, user_id, timestamp, user_message, agent_response, intent_category)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (session_id, user_id, datetime.now().isoformat(), user_message, agent_response, intent_category))
        
        conversation_id = cursor.lastrowid
        
        # Insert troubleshooting steps if provided
        if steps:
            for i, step in enumerate(steps):
                cursor.execute('''
                    INSERT INTO troubleshooting_steps (conversation_id, step_order, title, description)
                    VALUES (?, ?, ?, ?)
                ''', (conversation_id, i+1, step.get('title', ''), step.get('description', '')))
        
        conn.commit()
        conn.close()
        
        return conversation_id
    
    def get_conversation_history(self, session_id: str) -> List[Dict]:
        """Retrieve conversation history for a session"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, session_id, user_id, timestamp, user_message, agent_response, intent_category, created_at
            FROM conversations
            WHERE session_id = ?
            ORDER BY created_at ASC
        ''', (session_id,))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [
            {
                "id": row[0],
                "session_id": row[1],
                "user_id": row[2],
                "timestamp": row[3],
                "user_message": row[4],
                "agent_response": row[5],
                "intent_category": row[6],
                "created_at": row[7]
            }
            for row in rows
        ]
    
    def get_troubleshooting_steps(self, conversation_id: int) -> List[Dict]:
        """Retrieve troubleshooting steps for a conversation"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT step_order, title, description, completed
            FROM troubleshooting_steps
            WHERE conversation_id = ?
            ORDER BY step_order ASC
        ''', (conversation_id,))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [
            {
                "order": row[0],
                "title": row[1],
                "description": row[2],
                "completed": row[3]
            }
            for row in rows
        ]
    
    def mark_step_complete(self, conversation_id: int, step_order: int):
        """Mark a troubleshooting step as complete"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE troubleshooting_steps
            SET completed = TRUE
            WHERE conversation_id = ? AND step_order = ?
        ''', (conversation_id, step_order))
        
        conn.commit()
        conn.close()