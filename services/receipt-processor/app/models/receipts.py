import json
from datetime import date, datetime
from decimal import Decimal
from enum import StrEnum

from pydantic import BaseModel, Field, field_validator


class ProcessingStatus(StrEnum):
    """Supported receipt processing statuses."""

    uploaded = "uploaded"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class ReceiptCreate(BaseModel):
    """Internal receipt creation payload."""

    id: str
    user_id: str
    original_filename: str
    storage_path: str
    mime_type: str
    file_size: int


class ReceiptItemCreate(BaseModel):
    """Line item extracted from a receipt."""

    receipt_id: str
    user_id: str
    description: str
    quantity: Decimal | None = None
    unit_price: Decimal | None = None
    total: Decimal | None = None


class ReceiptRecord(BaseModel):
    """Stored receipt record."""

    id: str
    user_id: str
    merchant: str = "Processing receipt"
    receipt_date: date
    category: str = "Uncategorised"
    total: Decimal = Decimal("0")
    currency: str = "GBP"
    confidence: int = Field(default=0, ge=0, le=100)
    status: str = "processing"
    is_business: bool = False
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
    ai_summary: str | None = None
    embedding: list[float] | None = None
    ocr_provider: str | None = None
    error_message: str | None = None
    created_at: datetime
    updated_at: datetime

    @field_validator("embedding", mode="before")
    @classmethod
    def parse_pgvector(cls, value: object) -> object:
        """Parse PostgREST pgvector text output into a float list."""
        if value is None or isinstance(value, list):
            return value
        if isinstance(value, str):
            parsed = json.loads(value)
            if isinstance(parsed, list):
                return parsed
        return value


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
