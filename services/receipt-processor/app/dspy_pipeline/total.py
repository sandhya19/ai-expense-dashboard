import re
from decimal import Decimal

from app.models.dspy import MoneyOutput, OCRTextInput


class TotalExtractionModule:
    """Extract total amount from OCR text."""

    def run(self, input_data: OCRTextInput) -> MoneyOutput:
        match = re.search(r"^\s*total\s+([0-9]+(?:\.[0-9]{2})?)", input_data.raw_text, re.I | re.M)
        return MoneyOutput(
            amount=Decimal(match.group(1)) if match else None,
            confidence=0.6 if match else 0,
        )
