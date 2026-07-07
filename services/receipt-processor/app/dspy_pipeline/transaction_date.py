import re
from datetime import date

from app.models.dspy import OCRTextInput, TransactionDateOutput

_MONTHS = {
    "jan": 1,
    "january": 1,
    "feb": 2,
    "february": 2,
    "mar": 3,
    "march": 3,
    "apr": 4,
    "april": 4,
    "may": 5,
    "jun": 6,
    "june": 6,
    "jul": 7,
    "july": 7,
    "aug": 8,
    "august": 8,
    "sep": 9,
    "sept": 9,
    "september": 9,
    "oct": 10,
    "october": 10,
    "nov": 11,
    "november": 11,
    "dec": 12,
    "december": 12,
}

_ISO_DATE_PATTERN = (
    r"\b(20[0-9]{2})[-/.](0?[1-9]|1[0-2])[-/.](0?[1-9]|[12][0-9]|3[01])\b"
)
_DAY_FIRST_DATE_PATTERN = (
    r"\b(0?[1-9]|[12][0-9]|3[01])[-/.](0?[1-9]|1[0-2])"
    r"[-/.]([0-9]{2}|20[0-9]{2})\b"
)


def _build_date(year: int, month: int, day: int) -> date | None:
    if year < 100:
        year += 2000
    try:
        return date(year, month, day)
    except ValueError:
        return None


class TransactionDateExtractionModule:
    """Extract transaction date from OCR text."""

    def run(self, input_data: OCRTextInput) -> TransactionDateOutput:
        text = input_data.raw_text

        iso_match = re.search(_ISO_DATE_PATTERN, text)
        if iso_match:
            parsed = _build_date(
                int(iso_match.group(1)),
                int(iso_match.group(2)),
                int(iso_match.group(3)),
            )
            if parsed:
                return TransactionDateOutput(transaction_date=parsed, confidence=0.8)

        numeric_match = re.search(_DAY_FIRST_DATE_PATTERN, text)
        if numeric_match:
            parsed = _build_date(
                int(numeric_match.group(3)),
                int(numeric_match.group(2)),
                int(numeric_match.group(1)),
            )
            if parsed:
                return TransactionDateOutput(transaction_date=parsed, confidence=0.75)

        month_names = "|".join(_MONTHS)
        named_match = re.search(
            rf"\b(0?[1-9]|[12][0-9]|3[01])\s+({month_names})\s+(20[0-9]{{2}}|[0-9]{{2}})\b",
            text,
            re.I,
        )
        if named_match:
            parsed = _build_date(
                int(named_match.group(3)),
                _MONTHS[named_match.group(2).lower()],
                int(named_match.group(1)),
            )
            if parsed:
                return TransactionDateOutput(transaction_date=parsed, confidence=0.75)

        return TransactionDateOutput(transaction_date=None, confidence=0)
