from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import User
from ..schemas.interventions import (
    InterventionCaseResponse, InterventionCreateRequest, InterventionUpdateRequest
)
from ..services.interventions import InterventionService
from .dependencies import get_current_user

router = APIRouter(prefix="/interventions", tags=["Interventions"])

@router.get("", response_model=List[dict])
def list_cases(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    mentor_id = current_user.user_id if current_user.role == "mentor" else None
    return InterventionService.list_cases(db=db, status=status, mentor_user_id=mentor_id)

@router.get("/{case_id}", response_model=dict)
def get_case(case_id: str, db: Session = Depends(get_db)):
    case = InterventionService.get_case_detail(db=db, case_id=case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Intervention case not found")
    return case

@router.post("", response_model=dict)
def create_case(
    req: InterventionCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    case = InterventionService.create_case(
        db=db,
        enrollment_id=req.enrollment_id,
        support_action=req.support_action,
        due_date=req.due_date,
        author_id=current_user.user_id,
        assigned_mentor_id=req.assigned_mentor_id,
        priority=req.priority or "High",
        notes=req.notes
    )
    return {"message": "Case created successfully", "case_id": case.case_id}

@router.patch("/{case_id}", response_model=dict)
def update_case(
    case_id: str,
    req: InterventionUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    case = InterventionService.update_case(
        db=db,
        case_id=case_id,
        author_id=current_user.user_id,
        status=req.status,
        assigned_mentor_id=req.assigned_mentor_id,
        support_action=req.support_action,
        due_date=req.due_date,
        notes=req.notes,
        new_note=req.new_note
    )
    return {"message": "Case updated successfully", "case_id": case.case_id}
