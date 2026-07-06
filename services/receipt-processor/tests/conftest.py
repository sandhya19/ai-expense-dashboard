from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient

from app.api.deps import get_current_user
from app.core.config import get_settings
from app.main import create_app
from app.models.auth import AuthenticatedUser


@pytest.fixture(autouse=True)
def local_backends(monkeypatch: pytest.MonkeyPatch) -> Generator[None, None, None]:
    monkeypatch.setenv("OCR_PROVIDER", "mock")
    monkeypatch.setenv("REPOSITORY_BACKEND", "memory")
    monkeypatch.setenv("STORAGE_BACKEND", "memory")
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    app = create_app()

    def user_override() -> AuthenticatedUser:
        return AuthenticatedUser(user_id="user-1", email="user@example.com")

    app.dependency_overrides[get_current_user] = user_override
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def unauthenticated_client() -> Generator[TestClient, None, None]:
    app = create_app()
    with TestClient(app) as test_client:
        yield test_client
