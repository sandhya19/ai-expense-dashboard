"""Optional Qwen second-pass extraction for receipts that fail reconciliation."""

import json
import re
from decimal import Decimal
from typing import Protocol

import httpx
from pydantic import BaseModel, Field, ValidationError

from app.core.config import Settings
from app.models.dspy import LineItemOutput


class LineItemRefiner(Protocol):
    """Refine OCR text into receipt line items when deterministic parsing is insufficient."""

    async def refine(
        self, raw_text: str, receipt_total: Decimal | None
    ) -> list[LineItemOutput] | None:
        """Return a candidate set of items, or None when no safe candidate is available."""


class _RefinedItemsResponse(BaseModel):
    items: list[LineItemOutput] = Field(max_length=200)


def _json_from_model_response(content: str) -> _RefinedItemsResponse | None:
    normalized = content.strip()
    normalized = re.sub(r"^```(?:json)?\s*", "", normalized, flags=re.I)
    normalized = re.sub(r"\s*```$", "", normalized)
    try:
        parsed = _RefinedItemsResponse.model_validate(json.loads(normalized))
    except (json.JSONDecodeError, ValidationError):
        return None

    if not parsed.items:
        return None
    if any(not item.description.strip() or item.total is None for item in parsed.items):
        return None
    return parsed


class QwenLineItemRefiner:
    """Ask Qwen for a strict, math-checkable item list from OCR text."""

    def __init__(self, api_key: str, base_url: str, model: str, timeout_seconds: float) -> None:
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.timeout_seconds = timeout_seconds

    async def refine(
        self, raw_text: str, receipt_total: Decimal | None
    ) -> list[LineItemOutput] | None:
        if not self.api_key or receipt_total is None:
            return None

        payload = {
            "model": self.model,
            "temperature": 0,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You extract receipt line items from OCR text. Return JSON only. "
                        "Never invent a product or price. "
                        "OCR lines may be split, reordered, or separated from their prices; "
                        "reconnect them only when the receipt text and final total support it. "
                        "Include discounts as negative line items. "
                        "Exclude headers, VAT/tax, subtotals, grand totals, payment/card rows, "
                        "addresses, and promotion slogans. For '2 @ £1.99', set quantity 2, "
                        "unit_price 1.99, total 3.98."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        "Return exactly {\"items\":[{\"description\":string,\"quantity\":number,"
                        "\"unit_price\":number,\"total\":number}]}. Values may be null only for "
                        "quantity or unit_price. Every item total must be present. "
                        "The sum of totals must equal "
                        f"{receipt_total:.2f} within 0.01.\n\nOCR text:\n{raw_text[:30000]}"
                    ),
                },
            ],
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions", headers=headers, json=payload
                )
                response.raise_for_status()
        except httpx.HTTPError:
            return None

        content = self._content(response.json())
        parsed = _json_from_model_response(content) if content else None
        return parsed.items if parsed else None

    @staticmethod
    def _content(payload: object) -> str | None:
        if not isinstance(payload, dict):
            return None
        choices = payload.get("choices")
        if not isinstance(choices, list) or not choices or not isinstance(choices[0], dict):
            return None
        message = choices[0].get("message")
        if not isinstance(message, dict):
            return None
        content = message.get("content")
        return content if isinstance(content, str) else None


def create_line_item_refiner(settings: Settings) -> LineItemRefiner | None:
    """Enable the second pass only when Qwen credentials are configured."""

    if not settings.qwen_line_item_refinement or not settings.qwen_api_key:
        return None
    return QwenLineItemRefiner(
        api_key=settings.qwen_api_key,
        base_url=settings.qwen_base_url,
        model=settings.qwen_line_item_model,
        timeout_seconds=settings.ocr_timeout_seconds,
    )
