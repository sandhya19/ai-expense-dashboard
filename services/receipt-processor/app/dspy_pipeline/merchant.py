from app.models.dspy import MerchantExtractionOutput, OCRTextInput

_KNOWN_MERCHANTS = (
    ("aldi stores", "Aldi"),
    ("b&m retail", "B&M"),
    ("b and m retail", "B&M"),
)


class MerchantExtractionModule:
    """Extract merchant name from OCR text."""

    def run(self, input_data: OCRTextInput) -> MerchantExtractionOutput:
        normalized_text = input_data.raw_text.lower()
        for alias, merchant in _KNOWN_MERCHANTS:
            if alias in normalized_text:
                return MerchantExtractionOutput(merchant_name=merchant, confidence=0.95)

        first_line = next(
            (line.strip() for line in input_data.raw_text.splitlines() if line.strip()),
            None,
        )
        return MerchantExtractionOutput(
            merchant_name=first_line,
            confidence=0.5 if first_line else 0,
        )
