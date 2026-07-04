from datetime import UTC, datetime
from decimal import Decimal
from typing import Protocol

import httpx
from fastapi.encoders import jsonable_encoder

from app.core.config import Settings
from app.models.receipts import ProcessingStatus, ReceiptCreate, ReceiptRecord


class ReceiptRepository(Protocol):
    """Receipt persistence interface."""

    async def create(self, payload: ReceiptCreate) -> ReceiptRecord:
        """Create a receipt record."""

    async def get(self, receipt_id: str) -> ReceiptRecord | None:
        """Fetch a receipt by id."""

    async def update(self, receipt_id: str, values: dict[str, object]) -> ReceiptRecord:
        """Update a receipt."""


class MemoryReceiptRepository:
    """In-memory repository for tests and local development."""

    def __init__(self) -> None:
        self.records: dict[str, ReceiptRecord] = {}

    async def create(self, payload: ReceiptCreate) -> ReceiptRecord:
        now = datetime.now(UTC)
        record = ReceiptRecord(
            id=payload.id,
            user_id=payload.user_id,
            merchant="Processing receipt",
            receipt_date=now.date(),
            category="Uncategorised",
            total=Decimal("0"),
            currency="GBP",
            confidence=0,
            status="processing",
            is_business=False,
            original_filename=payload.original_filename,
            storage_path=payload.storage_path,
            mime_type=payload.mime_type,
            file_size=payload.file_size,
            processing_status=ProcessingStatus.uploaded,
            created_at=now,
            updated_at=now,
        )
        self.records[record.id] = record
        return record

    async def get(self, receipt_id: str) -> ReceiptRecord | None:
        return self.records.get(receipt_id)

    async def update(self, receipt_id: str, values: dict[str, object]) -> ReceiptRecord:
        record = self.records[receipt_id]
        updated = record.model_copy(update={**values, "updated_at": datetime.now(UTC)})
        self.records[receipt_id] = updated
        return updated


class SupabaseReceiptRepository:
    """Supabase PostgREST repository using a service-role key."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    @property
    def _headers(self) -> dict[str, str]:
        return {
            "apikey": self.settings.supabase_service_role_key,
            "Authorization": f"Bearer {self.settings.supabase_service_role_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

    @property
    def _base_url(self) -> str:
        return f"{self.settings.supabase_url}/rest/v1/{self.settings.supabase_receipts_table}"

    async def create(self, payload: ReceiptCreate) -> ReceiptRecord:
        body = {
            "id": payload.id,
            "user_id": payload.user_id,
            "merchant": "Processing receipt",
            "receipt_date": datetime.now(UTC).date(),
            "category": "Uncategorised",
            "total": 0,
            "currency": "GBP",
            "confidence": 0,
            "status": "processing",
            "is_business": False,
            "original_filename": payload.original_filename,
            "storage_path": payload.storage_path,
            "mime_type": payload.mime_type,
            "file_size": payload.file_size,
            "processing_status": ProcessingStatus.uploaded,
        }
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                self._base_url,
                headers=self._headers,
                json=jsonable_encoder(body),
            )
            response.raise_for_status()
            return ReceiptRecord.model_validate(response.json()[0])

    async def get(self, receipt_id: str) -> ReceiptRecord | None:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(
                f"{self._base_url}?id=eq.{receipt_id}&select=*",
                headers=self._headers,
            )
            response.raise_for_status()
            data = response.json()
            return ReceiptRecord.model_validate(data[0]) if data else None

    async def update(self, receipt_id: str, values: dict[str, object]) -> ReceiptRecord:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.patch(
                f"{self._base_url}?id=eq.{receipt_id}",
                headers=self._headers,
                json=jsonable_encoder(values),
            )
            response.raise_for_status()
            return ReceiptRecord.model_validate(response.json()[0])
