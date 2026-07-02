from fastapi.testclient import TestClient


def test_upload_requires_authentication(unauthenticated_client: TestClient) -> None:
    response = unauthenticated_client.post(
        "/v1/receipts",
        files={"file": ("receipt.pdf", b"%PDF-1.4", "application/pdf")},
    )
    assert response.status_code == 401
