from app.dspy_pipeline.money import find_labeled_amount
from app.models.dspy import MoneyOutput, OCRTextInput


class SubtotalExtractionModule:
    """Extract subtotal amount from OCR text."""

    def run(self, input_data: OCRTextInput) -> MoneyOutput:
        amount = find_labeled_amount(
            input_data.raw_text,
            ["subtotal", "sub total", "net total", "goods"],
        )
        return MoneyOutput(
            amount=amount,
            confidence=0.75 if amount is not None else 0,
        )
