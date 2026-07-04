from app.models.dspy import OCRTextInput, TransactionDateOutput


class TransactionDateExtractionModule:
    """Extract transaction date from OCR text."""

    def run(self, input_data: OCRTextInput) -> TransactionDateOutput:
        return TransactionDateOutput(transaction_date=None, confidence=0)
