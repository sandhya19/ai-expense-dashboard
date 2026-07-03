from fastapi.testclient import TestClient

from app.api.deps import get_current_user
from app.main import create_app
from app.models.auth import AuthenticatedUser


def test_receipt_creation(client: TestClient) -> None:
    response = client.post(
        "/v1/receipts",
        files={"file": ("receipt.png", b"png-bytes", "image/png")},
    )
    assert response.status_code == 201
    receipt = response.json()["receipt"]
    assert receipt["user_id"] == "user-1"
    assert receipt["processing_status"] == "completed"
    assert receipt["status"] == "completed"
    assert receipt["merchant"] == "Mock Merchant"
    assert receipt["total"] == "12.00"
    assert receipt["currency"] == "GBP"
    assert receipt["category"] == "Other"
    assert receipt["confidence"] > 0
    assert receipt["ocr_provider"] == "mock"


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
