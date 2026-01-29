from fastapi import APIRouter, HTTPException, status
from datetime import timedelta
from .auth import (
    authenticate_user,
    create_access_token,
    Token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    mock_users,
    get_password_hash,
    create_reset_token,
    verify_reset_token,
    UserInDB
)
from .models import UserCreate, UserLogin, PasswordResetRequest, PasswordResetConfirm
import uuid

auth_router = APIRouter(prefix="/auth", tags=["authentication"])

@auth_router.post("/signup", response_model=Token)
async def signup_user(user_data: UserCreate):
    # Check if user already exists
    if user_data.email in mock_users:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    # Hash the password
    hashed_password = get_password_hash(user_data.password)
    
    # Create user ID
    user_id = f"user-{str(uuid.uuid4())[:8]}"
    
    # Create user in database (mock)
    mock_users[user_data.email] = UserInDB(
        id=user_id,
        email=user_data.email,
        name=user_data.name,
        account_number=user_data.account_number,
        plan=user_data.plan,
        device_os=user_data.device_os,
        hashed_password=hashed_password
    )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_data.email}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user_id
    }

@auth_router.post("/login", response_model=Token)
async def login_for_access_token(form_data: UserLogin):
    user = authenticate_user(mock_users, form_data.email, form_data.password)
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

@auth_router.post("/request-password-reset")
async def request_password_reset(request: PasswordResetRequest):
    # Check if user exists
    if request.email not in mock_users:
        # We don't reveal if email exists for security
        return {"message": "If the email exists, a reset link has been sent"}
    
    # Create reset token
    token = create_reset_token(request.email)
    
    # In a real application, you would send an email with the reset link
    # For demo purposes, we'll just return the token
    print(f"Password reset token for {request.email}: {token}")
    
    return {"message": "If the email exists, a reset link has been sent"}

@auth_router.post("/reset-password")
async def reset_password(confirm: PasswordResetConfirm):
    # Verify the reset token
    email = verify_reset_token(confirm.token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Check if email matches the token
    if email != confirm.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email does not match the reset token"
        )
    
    # Hash the new password
    hashed_password = get_password_hash(confirm.new_password)
    
    # Update user's password
    mock_users[email].hashed_password = hashed_password
    
    # Remove the used token
    # Note: In production, you'd want to clean up expired tokens periodically
    
    return {"message": "Password has been reset successfully"}