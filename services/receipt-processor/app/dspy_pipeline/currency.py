import re

from app.models.dspy import CurrencyOutput, OCRTextInput

_SYMBOL_CURRENCIES = {
    "\u00a3": "GBP",
    "$": "USD",
    "\u20ac": "EUR",
}


class CurrencyExtractionModule:
    """Extract transaction currency from OCR text."""

    def run(self, input_data: OCRTextInput) -> CurrencyOutput:
        match = re.search(r"\b(GBP|USD|EUR)\b", input_data.raw_text, re.I)
        if match:
            return CurrencyOutput(currency=match.group(1).upper(), confidence=0.8)

        for symbol, currency in _SYMBOL_CURRENCIES.items():
            if symbol in input_data.raw_text:
                return CurrencyOutput(currency=currency, confidence=0.65)

        return CurrencyOutput(currency=None, confidence=0)
