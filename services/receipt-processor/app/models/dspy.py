from datetime import date
from decimal import Decimal

from pydantic import BaseModel, Field


class OCRTextInput(BaseModel):
    raw_text: str


class MerchantExtractionOutput(BaseModel):
    merchant_name: str | None
    confidence: float = Field(ge=0, le=1)


class TransactionDateOutput(BaseModel):
    transaction_date: date | None
    confidence: float = Field(ge=0, le=1)


class ItemsOutput(BaseModel):
    items: list["LineItemOutput"]
    confidence: float = Field(ge=0, le=1)


class LineItemOutput(BaseModel):
    description: str
    quantity: Decimal | None = None
    unit_price: Decimal | None = None
    total: Decimal | None = None


class MoneyOutput(BaseModel):
    amount: Decimal | None
    confidence: float = Field(ge=0, le=1)


class CurrencyOutput(BaseModel):
    currency: str | None
    confidence: float = Field(ge=0, le=1)


class CategoryOutput(BaseModel):
    category: str | None
    confidence: float = Field(ge=0, le=1)


class SummaryOutput(BaseModel):
    summary: str


class ReceiptExtraction(BaseModel):
    merchant: MerchantExtractionOutput
    transaction_date: TransactionDateOutput
    items: ItemsOutput
    subtotal: MoneyOutput
    tax: MoneyOutput
    total: MoneyOutput
    currency: CurrencyOutput
    category: CategoryOutput
    summary: SummaryOutput
