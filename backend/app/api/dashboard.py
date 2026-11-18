from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import User, Term, CourseOffering
from ..services.dashboard import DashboardService
from .dependencies import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary")
def get_dashboard_summary(
    term_code: str = Query("2014J"),
    checkpoint: str = Query("W4"),
    offering_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Mentor scope: show their assigned students unless admin
    mentor_id = current_user.user_id if current_user.role == "mentor" else None
    
    return DashboardService.get_overview_summary(
        db=db,
        term_code=term_code,
        checkpoint=checkpoint,
        offering_id=offering_id,
        mentor_user_id=mentor_id
    )

@router.get("/filters")
def get_available_filters(db: Session = Depends(get_db)):
    terms = db.query(Term).order_by(Term.start_date.desc()).all()
    offerings = db.query(CourseOffering).all()
    
    return {
        "terms": [{"code": t.term_code, "name": t.term_name} for t in terms],
        "checkpoints": ["W2", "W4", "W6"],
        "offerings": [
            {
                "offering_id": o.offering_id,
                "term_code": o.term_code,
                "course_code": o.course_code,
                "course_name": o.course_name,
                "section": o.section
            }
            for o in offerings
        ]
    }
