from datetime import datetime, timedelta
from typing import Optional
import bcrypt
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
import sqlite3
import uuid

# Secret key for JWT signing (in production, use environment variable)
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: str

class TokenData(BaseModel):
    user_id: Optional[str] = None

class User(BaseModel):
    id: str
    email: str
    name: str
    account_number: str
    plan: str
    device_os: str

# Mock user database (in production, use actual database)
mock_users = {
    "demo@ispconnect.com": {
        "id": "user-001",
        "email": "demo@ispconnect.com",
        "name": "Alex Johnson",
        "account_number": "ACC-2024-78456",
        "plan": "Premium Fiber 500Mbps",
        "device_os": "Windows",
        "hashed_password": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S"  # demo123
    },
    "john@example.com": {
        "id": "user-002",
        "email": "john@example.com",
        "name": "John Smith",
        "account_number": "ACC-2024-12345",
        "plan": "Standard Cable 100Mbps",
        "device_os": "macOS",
        "hashed_password": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S"  # demo123
    }
}

def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_user(db, email: str):
    if email in db:
        user_dict = db[email]
        return User(
            id=user_dict["id"],
            email=user_dict["email"],
            name=user_dict["name"],
            account_number=user_dict["account_number"],
            plan=user_dict["plan"],
            device_os=user_dict["device_os"]
        )
    return None

def authenticate_user(db, email: str, password: str):
    user = get_user(db, email)
    if not user:
        return False
    if not verify_password(password, mock_users[email]["hashed_password"]):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = TokenData(user_id=user_id)
    except JWTError:
        raise credentials_exception
    user = get_user(mock_users, token_data.user_id)
    if user is None:
        raise credentials_exception
    return user

def generate_ticket_id():
    """Generate a unique ticket ID for each session"""
    return str(uuid.uuid4())