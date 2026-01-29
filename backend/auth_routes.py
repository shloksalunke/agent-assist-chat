from fastapi import APIRouter, HTTPException, status
from datetime import timedelta
from .auth import (
    authenticate_user,
    create_access_token,
    Token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    mock_users
)

auth_router = APIRouter(prefix="/auth", tags=["authentication"])

@auth_router.post("/login", response_model=Token)
async def login_for_access_token(form_data: dict):
    email = form_data.get("email")
    password = form_data.get("password")
    
    user = authenticate_user(mock_users, email, password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id
    }