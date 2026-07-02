from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient

from app.api.deps import get_current_user
from app.main import create_app
from app.models.auth import AuthenticatedUser


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
