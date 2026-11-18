from typing import Optional, Generator
from fastapi import Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import User, UserSession

def get_current_user(
    authorization: Optional[str] = Header(None),
    x_session_token: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:]
    elif x_session_token:
        token = x_session_token

    if not token:
        # For development / zero-setup demo mode: default to demo mentor if no header
        demo_user = db.query(User).filter(User.role == "mentor").first()
        if demo_user:
            return demo_user
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing session token or authentication header."
        )

    session_rec = db.query(UserSession).filter(UserSession.session_token == token).first()
    if not session_rec:
        # Check if token is user_id directly for easy demo testing
        u = db.query(User).filter(User.user_id == token).first()
        if u:
            return u
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token."
        )

    return session_rec.user

def require_role(allowed_roles: list):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. User role '{current_user.role}' not authorized for this operation."
            )
        return current_user
    return role_checker
