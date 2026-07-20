from app.dspy_pipeline.money import find_labeled_amount
from app.models.dspy import MoneyOutput, OCRTextInput


class TotalExtractionModule:
    """Extract total amount from OCR text."""

    def run(self, input_data: OCRTextInput) -> MoneyOutput:
        amount = find_labeled_amount(
            input_data.raw_text,
            ["total", "amount due", "card total", "balance due"],
        )
        return MoneyOutput(
            amount=amount,
            confidence=0.75 if amount is not None else 0,
        )
