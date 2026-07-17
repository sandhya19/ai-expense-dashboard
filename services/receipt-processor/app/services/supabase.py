from datetime import UTC, datetime
from decimal import Decimal
from typing import Protocol

import httpx
from fastapi.encoders import jsonable_encoder

from app.core.config import Settings
from app.models.receipts import ProcessingStatus, ReceiptCreate, ReceiptItemCreate, ReceiptRecord
from app.services.intelligence import (
    InsightPayload,
    PatternPayload,
    build_insights,
    build_profile,
    build_recurring_patterns,
    canonical_merchant,
)


class ReceiptRepository(Protocol):
    """Receipt persistence interface."""

    async def create(self, payload: ReceiptCreate) -> ReceiptRecord:
        """Create a receipt record."""

    async def get(self, receipt_id: str) -> ReceiptRecord | None:
        """Fetch a receipt by id."""

    async def update(self, receipt_id: str, values: dict[str, object]) -> ReceiptRecord:
        """Update a receipt."""

    async def replace_items(self, receipt_id: str, items: list[ReceiptItemCreate]) -> None:
        """Replace extracted receipt line items."""

    async def persist_intelligence(self, receipt: ReceiptRecord) -> None:
        """Persist derived insights without affecting receipt processing success."""


class MemoryReceiptRepository:
    """In-memory repository for tests and local development."""

    def __init__(self) -> None:
        self.records: dict[str, ReceiptRecord] = {}
        self.items: dict[str, list[ReceiptItemCreate]] = {}
        self.insights: dict[str, list[InsightPayload]] = {}
        self.profiles: dict[str, dict[str, object]] = {}
        self.patterns: dict[str, list[PatternPayload]] = {}

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

    async def replace_items(self, receipt_id: str, items: list[ReceiptItemCreate]) -> None:
        self.items[receipt_id] = items

    async def persist_intelligence(self, receipt: ReceiptRecord) -> None:
        history = [item for item in self.records.values() if item.user_id == receipt.user_id]
        self.insights[receipt.id] = build_insights(receipt, history)
        self.profiles[receipt.user_id] = build_profile(history)
        self.patterns[receipt.user_id] = build_recurring_patterns(history)


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

    @property
    def _items_url(self) -> str:
        return f"{self.settings.supabase_url}/rest/v1/{self.settings.supabase_receipt_items_table}"

    def _table_url(self, table: str) -> str:
        return f"{self.settings.supabase_url}/rest/v1/{table}"

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

    async def replace_items(self, receipt_id: str, items: list[ReceiptItemCreate]) -> None:
        async with httpx.AsyncClient(timeout=30) as client:
            delete_response = await client.delete(
                f"{self._items_url}?receipt_id=eq.{receipt_id}",
                headers=self._headers,
            )
            delete_response.raise_for_status()

            if not items:
                return

            insert_response = await client.post(
                self._items_url,
                headers=self._headers,
                json=jsonable_encoder([item.model_dump() for item in items]),
            )
            insert_response.raise_for_status()

    async def persist_intelligence(self, receipt: ReceiptRecord) -> None:
        async with httpx.AsyncClient(timeout=30) as client:
            history_response = await client.get(
                f"{self._base_url}?user_id=eq.{receipt.user_id}&processing_status=eq.completed&select=*&order=receipt_date.desc",
                headers=self._headers,
            )
            history_response.raise_for_status()
            history = [ReceiptRecord.model_validate(item) for item in history_response.json()]

            merchant_response = await client.post(
                f"{self._table_url('merchants')}?on_conflict=user_id,canonical_name",
                headers={
                    **self._headers,
                    "Prefer": "return=representation,resolution=merge-duplicates",
                },
                json={
                    "user_id": receipt.user_id,
                    "canonical_name": canonical_merchant(receipt.merchant),
                    "display_name": receipt.merchant,
                },
            )
            merchant_response.raise_for_status()

            delete_response = await client.delete(
                f"{self._table_url('insights')}?user_id=eq.{receipt.user_id}&receipt_id=eq.{receipt.id}",
                headers=self._headers,
            )
            delete_response.raise_for_status()

            insights = build_insights(receipt, history)
            insight_response = await client.post(
                self._table_url("insights"),
                headers=self._headers,
                json=jsonable_encoder([
                    {**insight, "user_id": receipt.user_id, "receipt_id": receipt.id}
                    for insight in insights
                ]),
            )
            insight_response.raise_for_status()

            profile_response = await client.post(
                f"{self._table_url('user_profiles')}?on_conflict=user_id",
                headers={
                    **self._headers,
                    "Prefer": "return=representation,resolution=merge-duplicates",
                },
                json=jsonable_encoder({"user_id": receipt.user_id, **build_profile(history)}),
            )
            profile_response.raise_for_status()

            pattern_delete_response = await client.delete(
                f"{self._table_url('spending_patterns')}?user_id=eq.{receipt.user_id}&pattern_type=eq.recurring_payment",
                headers=self._headers,
            )
            pattern_delete_response.raise_for_status()
            patterns = build_recurring_patterns(history)
            if patterns:
                pattern_response = await client.post(
                    self._table_url("spending_patterns"),
                    headers=self._headers,
                    json=jsonable_encoder([
                        {**pattern, "user_id": receipt.user_id} for pattern in patterns
                    ]),
                )
                pattern_response.raise_for_status()
