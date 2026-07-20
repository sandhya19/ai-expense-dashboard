"""Explainable spending intelligence derived from completed receipts."""

import re
from collections import defaultdict
from decimal import Decimal
from typing import TypedDict

from app.models.receipts import ReceiptRecord


class InsightPayload(TypedDict):
    insight_type: str
    title: str
    description: str
    supporting_data: dict[str, object]
    recommendation: str
    impact: str
    confidence: float
    period_start: str | None
    period_end: str | None


class PatternPayload(TypedDict):
    pattern_type: str
    period: str
    value: dict[str, object]
    confidence: float


def canonical_merchant(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


def _amount(receipt: ReceiptRecord) -> Decimal:
    return Decimal(receipt.total)


def build_insights(receipt: ReceiptRecord, history: list[ReceiptRecord]) -> list[InsightPayload]:
    """Create fact-based, user-readable insights without an LLM dependency."""

    receipt_total = _amount(receipt)
    insights: list[InsightPayload] = [
        {
            "insight_type": "spending_pattern",
            "title": f"A new {receipt.category.lower()} moment",
            "description": f"{receipt.merchant} was added to your spending memory.",
            "supporting_data": {"amount": float(receipt_total), "merchant": receipt.merchant},
            "recommendation": "Review the receipt if anything does not look quite right.",
            "impact": "low",
            "confidence": receipt.confidence / 100,
            "period_start": receipt.receipt_date.isoformat(),
            "period_end": receipt.receipt_date.isoformat(),
        }
    ]

    same_category = [
        item for item in history if item.id != receipt.id and item.category == receipt.category
    ]
    if same_category:
        average = sum((_amount(item) for item in same_category), Decimal("0")) / len(same_category)
        if average > 0 and receipt_total >= average * Decimal("1.25"):
            insights.append(
                {
                    "insight_type": "spending_pattern",
                    "title": f"Higher than your usual {receipt.category.lower()} spend",
                    "description": (
                        "This purchase is noticeably above your previous average "
                        "in the same category."
                    ),
                    "supporting_data": {
                        "amount": float(receipt_total),
                        "category_average": float(average.quantize(Decimal("0.01"))),
                    },
                    "recommendation": (
                        "Compare this receipt with your usual choices before "
                        "the next purchase."
                    ),
                    "impact": "medium",
                    "confidence": 0.85,
                    "period_start": receipt.receipt_date.isoformat(),
                    "period_end": receipt.receipt_date.isoformat(),
                }
            )
    return insights


def build_profile(history: list[ReceiptRecord]) -> dict[str, object]:
    """Build a compact, explainable profile for user_profiles."""

    total = sum((_amount(receipt) for receipt in history), Decimal("0"))
    by_trait: dict[str, Decimal] = defaultdict(lambda: Decimal("0"))
    for receipt in history:
        value = _amount(receipt)
        text = f"{receipt.merchant} {receipt.category}".lower()
        if any(term in text for term in ("coffee", "cafe", "starbucks", "costa", "pret")):
            by_trait["coffee-explorer"] += value
        if any(term in text for term in ("meal", "dining", "food", "grocer", "restaurant")):
            by_trait["food-lover"] += value
        if any(term in text for term in ("travel", "uber", "train", "flight", "hotel")):
            by_trait["traveller"] += value
        if any(term in text for term in ("lidl", "aldi", "discount", "clubcard", "sale")):
            by_trait["smart-shopper"] += value

    def score(value: Decimal, multiplier: int) -> int:
        return min(100, max(0, round(float(value / total) * multiplier))) if total else 0

    dates = sorted({receipt.receipt_date for receipt in history}, reverse=True)
    streak = 1 if dates else 0
    for current, previous in zip(dates, dates[1:], strict=False):
        if (current - previous).days != 1:
            break
        streak += 1

    smart_shopper_receipts = [
        receipt
        for receipt in history
        if any(
            term in f"{receipt.merchant} {receipt.category}".lower()
            for term in ("lidl", "aldi", "discount", "clubcard", "sale")
        )
    ]
    achievements: list[dict[str, object]] = []
    if len(smart_shopper_receipts) >= 3:
        latest_smart_shop = max(
            smart_shopper_receipts, key=lambda receipt: receipt.receipt_date
        )
        achievements.append(
            {
                "id": "smart-shopper",
                "title": "Smart Shopper",
                "description": "You have logged three value-focused purchases.",
                "unlocked_at": latest_smart_shop.receipt_date.isoformat(),
                "evidence": {
                    "receipt_count": len(smart_shopper_receipts),
                    "merchants": sorted(
                        {receipt.merchant for receipt in smart_shopper_receipts}
                    ),
                },
            }
        )

    return {
        "spending_dna": [
            {"id": "coffee-explorer", "score": score(by_trait["coffee-explorer"], 350)},
            {"id": "food-lover", "score": score(by_trait["food-lover"], 250)},
            {"id": "traveller", "score": score(by_trait["traveller"], 240)},
            {"id": "smart-shopper", "score": score(by_trait["smart-shopper"], 400)},
        ],
        "receipt_streak": streak,
        "last_receipt_at": dates[0].isoformat() if dates else None,
        "preferences": {"profile_version": 1, "achievements": achievements},
    }


def build_recurring_patterns(history: list[ReceiptRecord]) -> list[PatternPayload]:
    """Detect likely monthly payments from repeated merchant/amount/date signals."""

    by_merchant: dict[str, list[ReceiptRecord]] = defaultdict(list)
    for receipt in history:
        by_merchant[canonical_merchant(receipt.merchant)].append(receipt)

    patterns: list[PatternPayload] = []
    for _merchant, receipts in by_merchant.items():
        ordered = sorted(receipts, key=lambda item: item.receipt_date)
        if len(ordered) < 2:
            continue
        latest, previous = ordered[-1], ordered[-2]
        cadence_days = (latest.receipt_date - previous.receipt_date).days
        previous_amount = _amount(previous)
        latest_amount = _amount(latest)
        if not 21 <= cadence_days <= 40 or previous_amount <= 0:
            continue
        variance = abs(latest_amount - previous_amount) / previous_amount
        if variance > Decimal("0.12"):
            continue
        patterns.append(
            {
                "pattern_type": "recurring_payment",
                "period": "monthly",
                "value": {
                    "merchant": latest.merchant,
                    "amount": float(latest_amount),
                    "cadence_days": cadence_days,
                    "receipt_count": len(ordered),
                },
                "confidence": 0.82 if len(ordered) == 2 else 0.92,
            }
        )
    return patterns
