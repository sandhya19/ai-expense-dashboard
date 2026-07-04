from app.models.dspy import MerchantExtractionOutput, OCRTextInput


class MerchantExtractionModule:
    """Extract merchant name from OCR text."""

    def run(self, input_data: OCRTextInput) -> MerchantExtractionOutput:
        first_line = next(
            (line.strip() for line in input_data.raw_text.splitlines() if line.strip()),
            None,
        )
        return MerchantExtractionOutput(
            merchant_name=first_line,
            confidence=0.5 if first_line else 0,
        )
