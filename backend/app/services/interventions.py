"""
Intervention Case Management Service.
Handles student support workflows, mentor assignments, follow-up deadlines, and audit event logs.
"""

from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from ..models import InterventionCase, InterventionEvent, Enrollment, Student, CourseOffering

class InterventionService:
    @staticmethod
    def list_cases(
        db: Session,
        status: Optional[str] = None,
        mentor_user_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        query = db.query(InterventionCase).join(Enrollment).join(Student).join(CourseOffering)

        if status and status != "ALL":
            query = query.filter(InterventionCase.status == status)
        if mentor_user_id:
            query = query.filter(InterventionCase.assigned_mentor_id == mentor_user_id)

        cases = query.order_by(InterventionCase.due_date.asc()).all()
        now = datetime.utcnow()

        result = []
        for c in cases:
            enr = c.enrollment
            stu = enr.student
            off = enr.offering

            is_overdue = c.due_date < now and c.status in ["open", "in_progress", "pending_review"]
            result.append({
                "case_id": c.case_id,
                "enrollment_id": c.enrollment_id,
                "student_id": stu.student_id,
                "student_name": f"{stu.first_name} {stu.last_name}",
                "course_code": off.course_code,
                "course_name": off.course_name,
                "assigned_mentor_id": c.assigned_mentor_id,
                "status": c.status,
                "support_action": c.support_action,
                "priority": c.priority,
                "due_date": c.due_date.isoformat(),
                "is_overdue": is_overdue,
                "notes": c.notes,
                "created_by_user_id": c.created_by_user_id,
                "created_at": c.created_at.isoformat(),
                "updated_at": c.updated_at.isoformat(),
                "events_count": len(c.events)
            })

        return result

    @staticmethod
    def get_case_detail(db: Session, case_id: str) -> Optional[Dict[str, Any]]:
        c = db.query(InterventionCase).filter(InterventionCase.case_id == case_id).first()
        if not c:
            return None

        enr = c.enrollment
        stu = enr.student
        off = enr.offering
        now = datetime.utcnow()

        events_data = [
            {
                "event_id": ev.event_id,
                "author_user_id": ev.author_user_id,
                "event_type": ev.event_type,
                "description": ev.description,
                "created_at": ev.created_at.isoformat()
            }
            for ev in sorted(c.events, key=lambda x: x.created_at, reverse=True)
        ]

        return {
            "case_id": c.case_id,
            "enrollment_id": c.enrollment_id,
            "student_id": stu.student_id,
            "student_name": f"{stu.first_name} {stu.last_name}",
            "student_email": stu.email,
            "course_code": off.course_code,
            "course_name": off.course_name,
            "assigned_mentor_id": c.assigned_mentor_id,
            "status": c.status,
            "support_action": c.support_action,
            "priority": c.priority,
            "due_date": c.due_date.isoformat(),
            "is_overdue": c.due_date < now and c.status in ["open", "in_progress", "pending_review"],
            "notes": c.notes,
            "created_by_user_id": c.created_by_user_id,
            "created_at": c.created_at.isoformat(),
            "updated_at": c.updated_at.isoformat(),
            "events": events_data
        }

    @staticmethod
    def create_case(
        db: Session,
        enrollment_id: str,
        support_action: str,
        due_date: datetime,
        author_id: str,
        assigned_mentor_id: Optional[str] = None,
        priority: str = "High",
        notes: Optional[str] = None
    ) -> InterventionCase:
        suffix = enrollment_id.split('-')[1] if '-' in enrollment_id else enrollment_id[:6]
        case_id = f"CASE-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{suffix}"
        new_case = InterventionCase(
            case_id=case_id,
            enrollment_id=enrollment_id,
            assigned_mentor_id=assigned_mentor_id or author_id,
            status="open",
            support_action=support_action,
            priority=priority,
            due_date=due_date,
            notes=notes,
            created_by_user_id=author_id
        )
        db.add(new_case)
        db.flush()

        # Audit event
        event = InterventionEvent(
            case_id=case_id,
            author_user_id=author_id,
            event_type="case_created",
            description=f"Case opened with action '{support_action}'. Assigned to {assigned_mentor_id or author_id}. Follow-up due {due_date.strftime('%Y-%m-%d')}."
        )
        db.add(event)
        db.commit()
        db.refresh(new_case)
        return new_case

    @staticmethod
    def update_case(
        db: Session,
        case_id: str,
        author_id: str,
        status: Optional[str] = None,
        assigned_mentor_id: Optional[str] = None,
        support_action: Optional[str] = None,
        due_date: Optional[datetime] = None,
        notes: Optional[str] = None,
        new_note: Optional[str] = None
    ) -> InterventionCase:
        case = db.query(InterventionCase).filter(InterventionCase.case_id == case_id).first()
        if not case:
            raise ValueError(f"Case {case_id} not found")

        changes = []
        if status and status != case.status:
            changes.append(f"Status changed from {case.status} to {status}")
            case.status = status
        if assigned_mentor_id and assigned_mentor_id != case.assigned_mentor_id:
            changes.append(f"Mentor reassigned to {assigned_mentor_id}")
            case.assigned_mentor_id = assigned_mentor_id
        if support_action and support_action != case.support_action:
            changes.append(f"Support action updated to '{support_action}'")
            case.support_action = support_action
        if due_date and due_date != case.due_date:
            changes.append(f"Follow-up due date updated to {due_date.strftime('%Y-%m-%d')}")
            case.due_date = due_date
        if notes:
            case.notes = notes

        if new_note:
            note_event = InterventionEvent(
                case_id=case_id,
                author_user_id=author_id,
                event_type="note_added",
                description=new_note
            )
            db.add(note_event)

        if changes:
            status_event = InterventionEvent(
                case_id=case_id,
                author_user_id=author_id,
                event_type="status_changed",
                description="; ".join(changes)
            )
            db.add(status_event)

        case.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(case)
        return case
