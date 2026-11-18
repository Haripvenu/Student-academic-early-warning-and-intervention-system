from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import ImportBatch, ImportRowError, User
from ..services.csv_import import CSVImportService
from .dependencies import get_current_user, require_role

router = APIRouter(prefix="/imports", tags=["Imports"])

@router.get("/batches", response_model=List[dict])
def list_import_batches(db: Session = Depends(get_db)):
    batches = db.query(ImportBatch).order_by(ImportBatch.created_at.desc()).all()
    return [
        {
            "batch_id": b.batch_id,
            "entity_type": b.entity_type,
            "file_name": b.file_name,
            "status": b.status,
            "total_rows": b.total_rows,
            "imported_rows": b.imported_rows,
            "error_rows": b.error_rows,
            "created_at": b.created_at.isoformat()
        }
        for b in batches
    ]

@router.get("/batches/{batch_id}/errors", response_model=List[dict])
def get_batch_errors(batch_id: str, db: Session = Depends(get_db)):
    errors = db.query(ImportRowError).filter(ImportRowError.batch_id == batch_id).all()
    return [
        {
            "error_id": e.error_id,
            "row_number": e.row_number,
            "source_record_id": e.source_record_id,
            "error_reason": e.error_reason,
            "raw_payload": e.raw_payload
        }
        for e in errors
    ]

@router.post("/upload")
async def upload_csv_file(
    entity_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only UTF-8 formatted .csv files are supported.")

    content = await file.read()
    decoded = content.decode("utf-8")

    result = CSVImportService.process_csv(
        db=db,
        entity_type=entity_type,
        file_name=file.filename,
        csv_content=decoded
    )
    return result
