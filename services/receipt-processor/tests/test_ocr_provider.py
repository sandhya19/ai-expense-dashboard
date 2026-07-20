import json

import httpx
import pytest

from app.core.config import Settings
from app.providers.ocr import MockOCRProvider, QwenVLOCRProvider, create_ocr_provider


def test_ocr_provider_selection_defaults_to_mock() -> None:
    provider = create_ocr_provider(Settings(ocr_provider="mock"))
    assert isinstance(provider, MockOCRProvider)


def test_ocr_provider_selection_supports_qwen_vl() -> None:
    provider = create_ocr_provider(Settings(ocr_provider="qwen_vl", qwen_api_key="key"))
    assert isinstance(provider, QwenVLOCRProvider)


@pytest.mark.asyncio
async def test_mock_ocr_response() -> None:
    provider = MockOCRProvider()
    result = await provider.extract_text(b"image", "image/png")
    assert result.provider_name == "mock"
    assert "Mock Merchant" in result.raw_text
    assert result.error is None


@pytest.mark.asyncio
async def test_qwen_vl_requires_api_key() -> None:
    provider = QwenVLOCRProvider(
        api_key="",
        base_url="https://example.com",
        model="qwen-vl-max",
        timeout_seconds=1,
        max_retries=0,
    )

    result = await provider.extract_text(b"image", "image/png")

    assert result.provider_name == "qwen_vl"
    assert result.error == "Qwen API key is not configured"


@pytest.mark.asyncio
async def test_qwen_vl_rejects_pdf_until_rendering_is_added() -> None:
    provider = QwenVLOCRProvider(
        api_key="key",
        base_url="https://example.com",
        model="qwen-vl-max",
        timeout_seconds=1,
        max_retries=0,
    )

    result = await provider.extract_text(b"%PDF-1.4", "application/pdf")

    assert result.provider_name == "qwen_vl"
    assert result.error == "Qwen OCR currently supports JPG and PNG uploads"


@pytest.mark.asyncio
async def test_qwen_vl_extracts_text_from_openai_compatible_response(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    captured_request: httpx.Request | None = None
    real_async_client = httpx.AsyncClient

    async def handler(request: httpx.Request) -> httpx.Response:
        nonlocal captured_request
        captured_request = request
        return httpx.Response(
            200,
            json={
                "choices": [
                    {
                        "message": {
                            "content": "Shop One\nSubtotal 10.00\nTotal 12.00",
                        }
                    }
                ]
            },
        )

    transport = httpx.MockTransport(handler)

    class MockAsyncClient:
        def __init__(self, **_: object) -> None:
            self.client = real_async_client(transport=transport)

        async def __aenter__(self) -> "MockAsyncClient":
            return self

        async def __aexit__(self, *args: object) -> None:
            await self.client.aclose()

        async def post(
            self,
            url: str,
            headers: dict[str, str],
            json: dict[str, object],
        ) -> httpx.Response:
            return await self.client.post(url, headers=headers, json=json)

    monkeypatch.setattr(httpx, "AsyncClient", MockAsyncClient)

    provider = QwenVLOCRProvider(
        api_key="test-key",
        base_url="https://example.com/compatible-mode/v1",
        model="qwen-vl-max",
        timeout_seconds=1,
        max_retries=0,
    )

    result = await provider.extract_text(b"image", "image/png")

    assert result.raw_text == "Shop One\nSubtotal 10.00\nTotal 12.00"
    assert result.provider_name == "qwen_vl"
    assert result.metadata["model"] == "qwen-vl-max"
    assert captured_request is not None
    assert captured_request.url.path == "/compatible-mode/v1/chat/completions"


@pytest.mark.asyncio
async def test_qwen_ocr_model_uses_native_text_recognition_task(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    captured_request: httpx.Request | None = None
    real_async_client = httpx.AsyncClient

    async def handler(request: httpx.Request) -> httpx.Response:
        nonlocal captured_request
        captured_request = request
        return httpx.Response(
            200,
            json={
                "output": {
                    "choices": [
                            {"message": {"content": [{"text": "Shop One\nTotal 12.00"}]}}
                    ]
                }
            },
        )

    transport = httpx.MockTransport(handler)

    class MockAsyncClient:
        def __init__(self, **_: object) -> None:
            self.client = real_async_client(transport=transport)

        async def __aenter__(self) -> "MockAsyncClient":
            return self

        async def __aexit__(self, *args: object) -> None:
            await self.client.aclose()

        async def post(
            self,
            url: str,
            headers: dict[str, str],
            json: dict[str, object],
        ) -> httpx.Response:
            return await self.client.post(url, headers=headers, json=json)

    monkeypatch.setattr(httpx, "AsyncClient", MockAsyncClient)

    provider = QwenVLOCRProvider(
        api_key="test-key",
        base_url="https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
        model="qwen-vl-ocr-2025-11-20",
        timeout_seconds=1,
        max_retries=0,
    )

    result = await provider.extract_text(b"image", "image/png")

    assert result.raw_text == "Shop One\nTotal 12.00"
    assert captured_request is not None
    assert captured_request.url.path == "/api/v1/services/aigc/multimodal-generation/generation"
    payload = json.loads(captured_request.content)
    assert payload["parameters"]["ocr_options"]["task"] == "text_recognition"


def test_qwen_ocr_rejects_coordinate_only_output() -> None:
    provider = QwenVLOCRProvider(
        api_key="test-key",
        base_url="https://example.com",
        model="qwen-vl-ocr",
        timeout_seconds=1,
        max_retries=0,
    )

    with pytest.raises(Exception, match="layout coordinates"):
        provider._raise_if_coordinate_only("500,138,13,133,90\n498,151,12,175,90")
