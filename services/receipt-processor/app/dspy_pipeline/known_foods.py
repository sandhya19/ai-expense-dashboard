"""Curated food names used to correct high-confidence OCR spelling variants.

This is deliberately a small, conservative vocabulary. It normalises a known
item only when the OCR text is an exact alias or a very close spelling match;
the receipt review screen remains the final source of truth.
"""

import re
from difflib import SequenceMatcher

INDIAN_FOOD_ALIASES: dict[str, tuple[str, ...]] = {
    "Masala Dosa": ("masala dosa", "masala dosai", "masala dossa"),
    "Plain Dosa": ("plain dosa", "plain dosai"),
    "Mysore Masala Dosa": ("mysore masala dosa", "mysore dosa"),
    "Chole Bhature": ("chole bhature", "chole bhatura", "chana bhatura"),
    "Dahi Puri": ("dahi puri", "dahi poori"),
    "Pani Puri": ("pani puri", "gol gappa", "golgappa"),
    "Sev Puri": ("sev puri",),
    "Bhel Puri": ("bhel puri",),
    "Samosa": ("samosa",),
    "Pakora": ("pakora", "pakoda"),
    "Vada Pav": ("vada pav", "wada pav"),
    "Pav Bhaji": ("pav bhaji",),
    "Aloo Paratha": ("aloo paratha",),
    "Paneer Tikka": ("paneer tikka",),
    "Butter Chicken": ("butter chicken",),
    "Chicken Tikka Masala": ("chicken tikka masala",),
    "Dal Makhani": ("dal makhani", "daal makhani"),
    "Chana Masala": ("chana masala", "chole masala"),
    "Vegetable Biryani": ("veg biryani", "vegetable biryani"),
    "Chicken Biryani": ("chicken biryani",),
    "Garlic Naan": ("garlic naan",),
    "Plain Naan": ("plain naan",),
    "Tandoori Roti": ("tandoori roti",),
    "Gulab Jamun": ("gulab jamun",),
    "Mango Lassi": ("mango lassi",),
}


def _normalise(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


def normalise_known_indian_food(description: str) -> str:
    """Return canonical food name for an exact or close OCR spelling match."""

    normalized = _normalise(description)
    if not normalized or len(normalized) < 5 or len(normalized) > 40:
        return description

    aliases = [
        (canonical, _normalise(alias))
        for canonical, values in INDIAN_FOOD_ALIASES.items()
        for alias in values
    ]
    for canonical, alias in aliases:
        if normalized == alias:
            return canonical

    candidate = max(
        aliases,
        key=lambda entry: SequenceMatcher(None, normalized, entry[1]).ratio(),
    )
    similarity = SequenceMatcher(None, normalized, candidate[1]).ratio()
    return candidate[0] if similarity >= 0.88 else description
