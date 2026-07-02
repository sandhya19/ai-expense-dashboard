from app.dspy_pipeline.category import CategoryClassificationModule
from app.dspy_pipeline.currency import CurrencyExtractionModule
from app.dspy_pipeline.items import ItemExtractionModule
from app.dspy_pipeline.merchant import MerchantExtractionModule
from app.dspy_pipeline.subtotal import SubtotalExtractionModule
from app.dspy_pipeline.summary import SummaryGenerationModule
from app.dspy_pipeline.tax import TaxExtractionModule
from app.dspy_pipeline.total import TotalExtractionModule
from app.dspy_pipeline.transaction_date import TransactionDateExtractionModule
from app.models.dspy import OCRTextInput, ReceiptExtraction


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
        return ReceiptExtraction(
            merchant=self.merchant.run(input_data),
            transaction_date=self.transaction_date.run(input_data),
            items=self.items.run(input_data),
            subtotal=self.subtotal.run(input_data),
            tax=self.tax.run(input_data),
            total=self.total.run(input_data),
            currency=self.currency.run(input_data),
            category=self.category.run(input_data),
            summary=self.summary.run(input_data),
        )
