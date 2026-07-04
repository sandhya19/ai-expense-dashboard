import re

from app.models.dspy import CurrencyOutput, OCRTextInput


class CurrencyExtractionModule:
    """Extract transaction currency from OCR text."""

    def run(self, input_data: OCRTextInput) -> CurrencyOutput:
        match = re.search(r"\b(GBP|USD|EUR)\b", input_data.raw_text, re.I)
        currency = match.group(1).upper() if match else None
        return CurrencyOutput(currency=currency, confidence=0.7 if currency else 0)
