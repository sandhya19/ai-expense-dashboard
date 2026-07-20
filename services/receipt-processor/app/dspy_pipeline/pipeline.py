from decimal import Decimal

from app.dspy_pipeline.category import CategoryClassificationModule
from app.dspy_pipeline.currency import CurrencyExtractionModule
from app.dspy_pipeline.items import ItemExtractionModule
from app.dspy_pipeline.merchant import MerchantExtractionModule
from app.dspy_pipeline.subtotal import SubtotalExtractionModule
from app.dspy_pipeline.summary import SummaryGenerationModule
from app.dspy_pipeline.tax import TaxExtractionModule
from app.dspy_pipeline.total import TotalExtractionModule
from app.dspy_pipeline.transaction_date import TransactionDateExtractionModule
from app.models.dspy import LineItemOutput, MoneyOutput, OCRTextInput, ReceiptExtraction


def _total_from_items(items: list[LineItemOutput]) -> MoneyOutput | None:
    item_totals = [item.total for item in items if item.total is not None]
    if not item_totals:
        return None

    return MoneyOutput(
        amount=sum(item_totals, Decimal("0")),
        confidence=0.65,
    )


class ReceiptExtractionPipeline:
    """Composable DSPy-ready receipt extraction pipeline."""

    def __init__(self) -> None:
        self.merchant = MerchantExtractionModule()
        self.transaction_date = TransactionDateExtractionModule()
        self.items = ItemExtractionModule()
        self.subtotal = SubtotalExtractionModule()
        self.tax = TaxExtractionModule()
        self.total = TotalExtractionModule()
        self.currency = CurrencyExtractionModule()
        self.category = CategoryClassificationModule()
        self.summary = SummaryGenerationModule()

    def run(self, raw_text: str) -> ReceiptExtraction:
        input_data = OCRTextInput(raw_text=raw_text)
        items = self.items.run(input_data)
        total = self.total.run(input_data)
        if total.amount is None:
            total = _total_from_items(items.items) or total

        return ReceiptExtraction(
            merchant=self.merchant.run(input_data),
            transaction_date=self.transaction_date.run(input_data),
            items=items,
            subtotal=self.subtotal.run(input_data),
            tax=self.tax.run(input_data),
            total=total,
            currency=self.currency.run(input_data),
            category=self.category.run(input_data),
            summary=self.summary.run(input_data),
        )
