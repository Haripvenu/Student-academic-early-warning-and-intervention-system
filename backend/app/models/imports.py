from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, JSON, ForeignKey, Text
from sqlalchemy.orm import relationship
from ..db import Base

class ImportBatch(Base):
    __tablename__ = "import_batches"

    batch_id = Column(String(100), primary_key=True)
    entity_type = Column(String(50), nullable=False) # "attendance", "submissions", "students", etc.
    file_name = Column(String(255), nullable=False)
    status = Column(String(50), default="completed") # "pending", "completed", "failed", "partially_failed"
    total_rows = Column(Integer, default=0)
    imported_rows = Column(Integer, default=0)
    error_rows = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    row_errors = relationship("ImportRowError", back_populates="batch", cascade="all, delete-orphan")

class ImportRowError(Base):
    __tablename__ = "import_row_errors"

    error_id = Column(Integer, primary_key=True, autoincrement=True)
    batch_id = Column(String(100), ForeignKey("import_batches.batch_id"), nullable=False, index=True)
    row_number = Column(Integer, nullable=False)
    source_record_id = Column(String(100), nullable=True)
    error_reason = Column(Text, nullable=False)
    raw_payload = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    batch = relationship("ImportBatch", back_populates="row_errors")
