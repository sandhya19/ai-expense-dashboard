import pytest

from app.core.config import Settings
from app.providers.ocr import MockOCRProvider, create_ocr_provider


def test_ocr_provider_selection_defaults_to_mock() -> None:
    provider = create_ocr_provider(Settings(ocr_provider="mock"))
    assert isinstance(provider, MockOCRProvider)


@pytest.mark.asyncio
async def test_mock_ocr_response() -> None:
    provider = MockOCRProvider()
    result = await provider.extract_text(b"image", "image/png")
    assert result.provider_name == "mock"
    assert "Mock Merchant" in result.raw_text
    assert result.error is None
