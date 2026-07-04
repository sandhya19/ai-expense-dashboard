from app.models.dspy import OCRTextInput, SummaryOutput


class SummaryGenerationModule:
    """Generate a short receipt summary."""

    def run(self, input_data: OCRTextInput) -> SummaryOutput:
        return SummaryOutput(summary="Receipt processed from OCR text.")
