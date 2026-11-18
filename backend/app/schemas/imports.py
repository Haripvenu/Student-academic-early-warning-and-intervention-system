from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class ImportRowErrorSchema(BaseModel):
    error_id: int
    batch_id: str
    row_number: int
    source_record_id: Optional[str] = None
    error_reason: str
    raw_payload: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)

class ImportBatchResponse(BaseModel):
    batch_id: str
    entity_type: str
    file_name: str
    status: str
    total_rows: int
    imported_rows: int
    error_rows: int
    created_at: datetime
    row_errors: Optional[List[ImportRowErrorSchema]] = None

    model_config = ConfigDict(from_attributes=True)
