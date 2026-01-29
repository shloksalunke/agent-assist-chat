from datetime import datetime, timedelta
from typing import Optional
import bcrypt
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
import uuid
import secrets

# Secret key for JWT signing (in production, use environment variable)
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
RESET_TOKEN_EXPIRE_MINUTES = 15

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

class UserInDB(User):
    hashed_password: str

# In-memory storage for reset tokens (in production, use Redis or database)
reset_tokens = {}

# Mock user database (in production, use actual database)
mock_users = {
    "demo@ispconnect.com": UserInDB(
        id="user-001",
        email="demo@ispconnect.com",
        name="Alex Johnson",
        account_number="ACC-2024-78456",
        plan="Premium Fiber 500Mbps",
        device_os="Windows",
        hashed_password="$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S"  # demo123
    ),
    "john@example.com": UserInDB(
        id="user-002",
        email="john@example.com",
        name="John Smith",
        account_number="ACC-2024-12345",
        plan="Standard Cable 100Mbps",
        device_os="macOS",
        hashed_password="$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S"  # demo123
    )
}

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_user(db, email: str):
    if email in db:
        return db[email]
    return None

def authenticate_user(db, email: str, password: str):
    user = get_user(db, email)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
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

def create_reset_token(email: str) -> str:
    # Generate a random token
    token = secrets.token_urlsafe(32)
    # Store with expiration
    reset_tokens[token] = {
        "email": email,
        "expires": datetime.utcnow() + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)
    }
    return token

def verify_reset_token(token: str) -> Optional[str]:
    if token not in reset_tokens:
        return None
    
    token_data = reset_tokens[token]
    if datetime.utcnow() > token_data["expires"]:
        # Token expired, remove it
        del reset_tokens[token]
        return None
    
    return token_data["email"]

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