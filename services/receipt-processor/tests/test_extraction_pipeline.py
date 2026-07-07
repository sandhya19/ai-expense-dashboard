from decimal import Decimal

from app.dspy_pipeline.pipeline import ReceiptExtractionPipeline


def test_pipeline_extracts_common_google_vision_receipt_text() -> None:
    raw_text = """
    Pret A Manger
    12 JUL 2026 14:03
    Latte 3.40
    Sandwich 5.95
    Sub Total \u00a39.35
    VAT \u00a31.87
    TOTAL GBP 11.22
    Card ending 1234
    """

    result = ReceiptExtractionPipeline().run(raw_text)

    assert result.merchant.merchant_name == "Pret A Manger"
    assert result.transaction_date.transaction_date is not None
    assert result.transaction_date.transaction_date.isoformat() == "2026-07-12"
    assert result.subtotal.amount == Decimal("9.35")
    assert result.tax.amount == Decimal("1.87")
    assert result.total.amount == Decimal("11.22")
    assert result.currency.currency == "GBP"
    assert result.category.category == "Meals"


def test_pipeline_extracts_amount_due_and_iso_date() -> None:
    raw_text = """
    Office Supplies Ltd
    Date: 2026-07-04
    Net total: USD 1,240.00
    Sales tax: $99.20
    Amount due: $1,339.20
    """

    result = ReceiptExtractionPipeline().run(raw_text)

    assert result.transaction_date.transaction_date is not None
    assert result.transaction_date.transaction_date.isoformat() == "2026-07-04"
    assert result.subtotal.amount == Decimal("1240.00")
    assert result.tax.amount == Decimal("99.20")
    assert result.total.amount == Decimal("1339.20")
    assert result.currency.currency == "USD"


def test_pipeline_ignores_vat_registration_number_for_tax() -> None:
    raw_text = """
    TESCO
    VAT Number: GB 220 4302 31
    Items total
    Total to pay
    \u00a344.52
    Clubcard points
    """

    result = ReceiptExtractionPipeline().run(raw_text)

    assert result.tax.amount is None


def test_pipeline_extracts_goods_line_as_subtotal() -> None:
    raw_text = """
    ALDI STORES
    GBP
    04/07/26
    Goods: 44.28
    Total: GBP44.28
    """

    result = ReceiptExtractionPipeline().run(raw_text)

    assert result.transaction_date.transaction_date is not None
    assert result.transaction_date.transaction_date.isoformat() == "2026-07-04"
    assert result.subtotal.amount == Decimal("44.28")
    assert result.total.amount == Decimal("44.28")
