from datetime import UTC, date, datetime
from decimal import Decimal

from fastapi.testclient import TestClient

from app.api.deps import get_current_user
from app.dspy_pipeline.pipeline import ReceiptExtractionPipeline
from app.main import create_app
from app.models.auth import AuthenticatedUser
from app.models.dspy import LineItemOutput
from app.models.ocr import OCRResult
from app.models.receipts import ProcessingStatus, ReceiptRecord
from app.providers.embeddings import MockEmbeddingProvider
from app.services.intelligence import build_profile
from app.services.processing import ReceiptProcessingService, line_items_match_total
from app.services.supabase import MemoryReceiptRepository


def test_receipt_creation(client: TestClient) -> None:
    response = client.post(
        "/v1/receipts",
        files={"file": ("receipt.png", b"png-bytes", "image/png")},
    )
    assert response.status_code == 201
    receipt = response.json()["receipt"]
    assert receipt["user_id"] == "user-1"
    assert receipt["processing_status"] == "completed"
    assert receipt["status"] == "review"
    assert receipt["merchant"] == "Mock Merchant"
    assert receipt["total"] == "12.00"
    assert receipt["currency"] == "GBP"
    assert receipt["category"] == "Other"
    assert receipt["confidence"] > 0
    assert receipt["ocr_provider"] == "mock"


def test_empty_line_items_cannot_validate_a_receipt() -> None:
    assert not line_items_match_total([], Decimal("12.00"))


def test_profile_unlocks_smart_shopper_after_three_value_receipts() -> None:
    now = datetime.now(UTC)
    history = [
        ReceiptRecord(
            id=f"receipt-{index}",
            user_id="user-1",
            merchant=merchant,
            receipt_date=date(2026, 7, 10 + index),
            category="Groceries",
            total=Decimal("20.00"),
            currency="GBP",
            confidence=90,
            status="completed",
            is_business=False,
            original_filename=f"receipt-{index}.png",
            storage_path=f"user-1/receipt-{index}.png",
            mime_type="image/png",
            file_size=1,
            processing_status=ProcessingStatus.completed,
            created_at=now,
            updated_at=now,
        )
        for index, merchant in enumerate(("Aldi", "Lidl", "Aldi"))
    ]

    profile = build_profile(history)

    assert profile["receipt_streak"] == 3
    assert profile["preferences"] == {
        "profile_version": 1,
        "achievements": [
            {
                "id": "smart-shopper",
                "title": "Smart Shopper",
                "description": "You have logged three value-focused purchases.",
                "unlocked_at": "2026-07-12",
                "evidence": {"receipt_count": 3, "merchants": ["Aldi", "Lidl"]},
            }
        ],
    }


class ReceiptTextOCRProvider:
    name = "test"

    async def extract_text(self, content: bytes, mime_type: str) -> OCRResult:
        return OCRResult(raw_text=content.decode(), provider_name=self.name, duration_ms=1)


class ReconciledLineItemRefiner:
    async def refine(
        self, raw_text: str, receipt_total: Decimal | None
    ) -> list[LineItemOutput]:
        assert "Total 20.00" in raw_text
        assert receipt_total == Decimal("20.00")
        return [
            LineItemOutput(
                description="Corrected item",
                quantity=Decimal("2"),
                unit_price=Decimal("10.00"),
                total=Decimal("20.00"),
            )
        ]


async def test_receipt_processing_persists_line_items() -> None:
    repository = MemoryReceiptRepository()
    service = ReceiptProcessingService(
        repository=repository,
        ocr_provider=ReceiptTextOCRProvider(),
        embedding_provider=MockEmbeddingProvider(),
        pipeline=ReceiptExtractionPipeline(),
    )
    now = datetime.now(UTC)
    receipt = ReceiptRecord(
        id="receipt-1",
        user_id="user-1",
        merchant="Processing receipt",
        receipt_date=date(2026, 7, 12),
        category="Uncategorised",
        total=Decimal("0"),
        currency="GBP",
        confidence=0,
        status="processing",
        is_business=False,
        original_filename="receipt.png",
        storage_path="user-1/receipt.png",
        mime_type="image/png",
        file_size=1,
        processing_status=ProcessingStatus.uploaded,
        created_at=now,
        updated_at=now,
    )
    repository.records[receipt.id] = receipt

    await service.process(
        receipt,
        b"Pret A Manger\nLatte 3.40\nSandwich 5.95\nSub Total 9.35\nVAT 1.87\nTotal 11.22",
    )

    assert [item.description for item in repository.items[receipt.id]] == ["Latte", "Sandwich"]
    assert [item.quantity for item in repository.items[receipt.id]] == [
        Decimal("1"),
        Decimal("1"),
    ]
    assert [item.unit_price for item in repository.items[receipt.id]] == [
        Decimal("3.40"),
        Decimal("5.95"),
    ]
    assert [item.total for item in repository.items[receipt.id]] == [
        Decimal("3.40"),
        Decimal("5.95"),
    ]
    assert repository.insights[receipt.id]
    assert repository.profiles[receipt.user_id]["spending_dna"]


async def test_receipt_processing_marks_review_when_line_items_do_not_match_total() -> None:
    repository = MemoryReceiptRepository()
    service = ReceiptProcessingService(
        repository=repository,
        ocr_provider=ReceiptTextOCRProvider(),
        embedding_provider=MockEmbeddingProvider(),
        pipeline=ReceiptExtractionPipeline(),
    )
    now = datetime.now(UTC)
    receipt = ReceiptRecord(
        id="receipt-1",
        user_id="user-1",
        merchant="Processing receipt",
        receipt_date=date(2026, 7, 12),
        category="Uncategorised",
        total=Decimal("0"),
        currency="GBP",
        confidence=0,
        status="processing",
        is_business=False,
        original_filename="receipt.png",
        storage_path="user-1/receipt.png",
        mime_type="image/png",
        file_size=1,
        processing_status=ProcessingStatus.uploaded,
        created_at=now,
        updated_at=now,
    )
    repository.records[receipt.id] = receipt

    updated = await service.process(
        receipt,
        b"Pret A Manger\nLatte 3.40\nSandwich 5.95\nTotal 20.00",
    )

    assert updated.processing_status == ProcessingStatus.completed
    assert updated.status == "review"


async def test_receipt_processing_accepts_only_a_reconciled_qwen_refinement() -> None:
    repository = MemoryReceiptRepository()
    service = ReceiptProcessingService(
        repository=repository,
        ocr_provider=ReceiptTextOCRProvider(),
        embedding_provider=MockEmbeddingProvider(),
        pipeline=ReceiptExtractionPipeline(),
        line_item_refiner=ReconciledLineItemRefiner(),
    )
    now = datetime.now(UTC)
    receipt = ReceiptRecord(
        id="receipt-1",
        user_id="user-1",
        merchant="Processing receipt",
        receipt_date=date(2026, 7, 12),
        category="Uncategorised",
        total=Decimal("0"),
        currency="GBP",
        confidence=0,
        status="processing",
        is_business=False,
        original_filename="receipt.png",
        storage_path="user-1/receipt.png",
        mime_type="image/png",
        file_size=1,
        processing_status=ProcessingStatus.uploaded,
        created_at=now,
        updated_at=now,
    )
    repository.records[receipt.id] = receipt

    updated = await service.process(
        receipt,
        b"Shop\nA 5.00\nTotal 20.00",
    )

    assert updated.status == "completed"
    assert [item.description for item in repository.items[receipt.id]] == ["Corrected item"]


def test_empty_file_rejected(client: TestClient) -> None:
    response = client.post(
        "/v1/receipts",
        files={"file": ("receipt.png", b"", "image/png")},
    )
    assert response.status_code == 400


def test_unsupported_mime_type_rejected(client: TestClient) -> None:
    response = client.post(
        "/v1/receipts",
        files={"file": ("receipt.txt", b"hello", "text/plain")},
    )
    assert response.status_code == 415


def test_unsupported_extension_rejected(client: TestClient) -> None:
    response = client.post(
        "/v1/receipts",
        files={"file": ("receipt.gif", b"png-bytes", "image/png")},
    )
    assert response.status_code == 415


def test_get_receipt_returns_owner_receipt(client: TestClient) -> None:
    created = client.post(
        "/v1/receipts",
        files={"file": ("receipt.pdf", b"%PDF-1.4", "application/pdf")},
    )
    receipt_id = created.json()["receipt"]["id"]
    response = client.get(f"/v1/receipts/{receipt_id}")
    assert response.status_code == 200
    assert response.json()["receipt"]["id"] == receipt_id


def test_reprocess_receipt_returns_updated_owner_receipt(client: TestClient) -> None:
    created = client.post(
        "/v1/receipts",
        files={"file": ("receipt.pdf", b"%PDF-1.4", "application/pdf")},
    )
    receipt_id = created.json()["receipt"]["id"]

    response = client.post(f"/v1/receipts/{receipt_id}/reprocess")

    assert response.status_code == 200
    receipt = response.json()["receipt"]
    assert receipt["id"] == receipt_id
    assert receipt["processing_status"] == "completed"
    assert receipt["ocr_provider"] == "mock"


def test_receipt_ownership_check() -> None:
    app = create_app()

    def user_one() -> AuthenticatedUser:
        return AuthenticatedUser(user_id="owner")

    app.dependency_overrides[get_current_user] = user_one
    with TestClient(app) as owner_client:
        created = owner_client.post(
            "/v1/receipts",
            files={"file": ("receipt.pdf", b"%PDF-1.4", "application/pdf")},
        )
        receipt_id = created.json()["receipt"]["id"]

    def user_two() -> AuthenticatedUser:
        return AuthenticatedUser(user_id="not-owner")

    app.dependency_overrides[get_current_user] = user_two
    with TestClient(app) as other_client:
        response = other_client.get(f"/v1/receipts/{receipt_id}")
    assert response.status_code == 403


def test_reprocess_receipt_ownership_check() -> None:
    app = create_app()

    def user_one() -> AuthenticatedUser:
        return AuthenticatedUser(user_id="owner")

    app.dependency_overrides[get_current_user] = user_one
    with TestClient(app) as owner_client:
        created = owner_client.post(
            "/v1/receipts",
            files={"file": ("receipt.pdf", b"%PDF-1.4", "application/pdf")},
        )
        receipt_id = created.json()["receipt"]["id"]

    def user_two() -> AuthenticatedUser:
        return AuthenticatedUser(user_id="not-owner")

    app.dependency_overrides[get_current_user] = user_two
    with TestClient(app) as other_client:
        response = other_client.post(f"/v1/receipts/{receipt_id}/reprocess")
    assert response.status_code == 403
