from app.models.dspy import ItemsOutput, OCRTextInput


class ItemExtractionModule:
    """Extract line items from OCR text."""

    def run(self, input_data: OCRTextInput) -> ItemsOutput:
        return ItemsOutput(items=[], confidence=0)
