import re

from app.dspy_pipeline.money import find_labeled_amount
from app.models.dspy import MoneyOutput, OCRTextInput

_TAX_RATE_ONLY_PATTERN = re.compile(
    r"^\s*(?:vat|tax)\s+\d+(?:\.\d+)?%\s*:?\s*$", re.I
)


class TaxExtractionModule:
    """Extract tax amount from OCR text."""

    def run(self, input_data: OCRTextInput) -> MoneyOutput:
        lines = input_data.raw_text.splitlines()
        for index, line in enumerate(lines):
            if not _TAX_RATE_ONLY_PATTERN.match(line):
                continue
            for next_line in lines[index + 1 :]:
                if not next_line.strip():
                    continue
                amount = find_labeled_amount(
                    f"VAT\n{next_line}", ["vat"]
                )
                if amount is not None:
                    return MoneyOutput(amount=amount, confidence=0.75)
                break

        amount = find_labeled_amount(
            input_data.raw_text,
            ["tax", "vat", "sales tax", "vat amount"],
            ignored_terms=["vat number", "vat no", "registration"],
        )
        return MoneyOutput(
            amount=amount,
            confidence=0.75 if amount is not None else 0,
        )
