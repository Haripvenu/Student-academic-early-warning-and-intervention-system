from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from ..db import get_db
from ..models import User, UserSession
from ..schemas.auth import LoginRequest, TokenResponse, UserResponse
from ..security import verify_password, hash_password, generate_session_token, calculate_expiry
from .dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password credentials."
        )

    token = generate_session_token()
    expiry = calculate_expiry(days=7)
    session = UserSession(session_token=token, user_id=user.user_id, expires_at=expiry)
    db.add(session)
    db.commit()

    return TokenResponse(
        session_token=token,
        user=UserResponse.model_validate(user),
        expires_at=expiry
    )

@router.get("/me", response_model=UserResponse)
def get_current_profile(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

@router.post("/demo-switch/{role}", response_model=TokenResponse)
def demo_switch_account(role: str, db: Session = Depends(get_db)):
    """
    Convenience endpoint for review committees and demo examiners to seamlessly
    switch between Mentor (Dr. Sarah Chen), Faculty (Prof. Alan Vance), and Admin (Elena Rostova).
    """
    user = db.query(User).filter(User.role == role.lower()).first()
    if not user:
        demo_profiles = {
            "mentor": ("MEN-01", "sarah.chen@campus.edu", "Dr. Sarah Chen"),
            "faculty": ("FAC-01", "alan.vance@campus.edu", "Prof. Alan Vance"),
            "admin": ("ADM-01", "admin@campus.edu", "Elena Rostova")
        }
        role_key = role.lower()
        if role_key in demo_profiles:
            uid, email, name = demo_profiles[role_key]
            user = User(
                user_id=uid,
                email=email,
                full_name=name,
                role=role_key,
                hashed_password=hash_password("password123"),
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            raise HTTPException(status_code=404, detail=f"No demo account found for role '{role}'")

    token = generate_session_token()
    expiry = calculate_expiry(days=7)
    session = UserSession(session_token=token, user_id=user.user_id, expires_at=expiry)
    db.add(session)
    db.commit()

    return TokenResponse(
        session_token=token,
        user=UserResponse.model_validate(user),
        expires_at=expiry
    )

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(UserSession).filter(UserSession.user_id == current_user.user_id).delete()
    db.commit()
    return {"message": "Session successfully terminated."}
