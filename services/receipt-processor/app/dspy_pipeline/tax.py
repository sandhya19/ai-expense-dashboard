from app.dspy_pipeline.money import find_labeled_amount
from app.models.dspy import MoneyOutput, OCRTextInput


class TaxExtractionModule:
    """Extract tax amount from OCR text."""

    def run(self, input_data: OCRTextInput) -> MoneyOutput:
        amount = find_labeled_amount(
            input_data.raw_text,
            ["tax", "vat", "sales tax", "vat amount"],
            ignored_terms=["vat number", "vat no", "registration"],
        )
        return MoneyOutput(
            amount=amount,
            confidence=0.75 if amount is not None else 0,
        )
