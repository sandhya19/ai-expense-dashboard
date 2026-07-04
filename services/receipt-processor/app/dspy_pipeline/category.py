from app.models.dspy import CategoryOutput, OCRTextInput


class CategoryClassificationModule:
    """Classify receipt category."""

    def run(self, input_data: OCRTextInput) -> CategoryOutput:
        text = input_data.raw_text.lower()
        category = (
            "Meals" if any(word in text for word in ["restaurant", "cafe", "pret"]) else "Other"
        )
        return CategoryOutput(category=category, confidence=0.3)
