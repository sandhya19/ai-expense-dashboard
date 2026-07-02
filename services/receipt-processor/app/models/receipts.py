from datetime import date, datetime
from decimal import Decimal
from enum import StrEnum

from pydantic import BaseModel, Field


class ProcessingStatus(StrEnum):
    """Supported receipt processing statuses."""

    uploaded = "uploaded"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class ReceiptCreate(BaseModel):
    """Internal receipt creation payload."""

    user_id: str
    original_filename: str
    storage_path: str
    mime_type: str
    file_size: int


class ReceiptRecord(BaseModel):
    """Stored receipt record."""

    id: str
    user_id: str
    original_filename: str
    storage_path: str
    mime_type: str
    file_size: int
    processing_status: ProcessingStatus
    raw_ocr_text: str | None = None
    merchant_name: str | None = None
    transaction_date: date | None = None
    subtotal: Decimal | None = None
    tax: Decimal | None = None
    total: Decimal | None = None
    currency: str | None = None
    category: str | None = None
    ai_summary: str | None = None
    embedding: list[float] | None = None
    ocr_provider: str | None = None
    error_message: str | None = None
    created_at: datetime
    updated_at: datetime


class ReceiptResponse(BaseModel):
    """Public receipt response."""

    receipt: ReceiptRecord


class HealthResponse(BaseModel):
    """Health check response."""

    status: str = "ok"
    version: str


class FileValidationResult(BaseModel):
    """Validated upload metadata and bytes."""

    filename: str
    mime_type: str
    content: bytes = Field(repr=False)

    @property
    def size(self) -> int:
        return len(self.content)
