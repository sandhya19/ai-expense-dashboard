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
    assert [item.description for item in result.items.items] == ["Latte", "Sandwich"]
    assert [item.total for item in result.items.items] == [Decimal("3.40"), Decimal("5.95")]


def test_pipeline_ignores_pret_header_and_location_from_fake_receipt() -> None:
    raw_text = """
    PRET A MANGER
    London Liverpool Street
    07 JUL 2026 13:05
    Latte                               \u00a33.40
    Chicken Caesar Sandwich             \u00a35.95
    Chocolate Brownie                   \u00a32.75
    Sub Total                           \u00a312.10
    VAT                                 \u00a32.42
    TOTAL GBP 14.52
    Card ending 1234
    """

    result = ReceiptExtractionPipeline().run(raw_text)

    assert [item.description for item in result.items.items] == [
        "Latte",
        "Chicken Caesar Sandwich",
        "Chocolate Brownie",
    ]
    assert [item.total for item in result.items.items] == [
        Decimal("3.40"),
        Decimal("5.95"),
        Decimal("2.75"),
    ]
    assert result.total.amount == Decimal("14.52")


def test_pipeline_excludes_restaurant_vat_and_payment_summary_rows() -> None:
    raw_text = """
    SKVP Slough
    Order payment receipt
    Date: 11.07.2026 13:24
    Name Qty Amount
    Masala Dosa
    4.95
    Chole Bhature
    8.70
    Dahi Puri
    5.20
    Amount excluding VAT
    15.70
    VAT 20%:
    3.15
    TOTAL DUE:
    18.85
    SyrvePay
    18.85
    VAT 337855368
    """

    result = ReceiptExtractionPipeline().run(raw_text)

    assert [item.description for item in result.items.items] == [
        "Masala Dosa",
        "Chole Bhature",
        "Dahi Puri",
    ]
    assert [item.total for item in result.items.items] == [
        Decimal("4.95"),
        Decimal("8.70"),
        Decimal("5.20"),
    ]
    assert result.subtotal.amount == Decimal("15.70")
    assert result.tax.amount == Decimal("3.15")
    assert result.total.amount == Decimal("18.85")


def test_pipeline_normalises_close_indian_food_ocr_spellings() -> None:
    raw_text = """
    SKVP Slough
    Masala Dossa 4.95
    Chole Bhatura 8.70
    Dahi Poori 5.20
    Total 18.85
    """

    result = ReceiptExtractionPipeline().run(raw_text)

    assert [item.description for item in result.items.items] == [
        "Masala Dosa",
        "Chole Bhature",
        "Dahi Puri",
    ]


def test_pipeline_parses_b_and_m_receipt_without_headers_or_promotions() -> None:
    raw_text = """
    Big Brands Big Savings
    B&M Retail Ltd
    EnglandSL1 4XP
    SALES VOUCHER
    HIMALAYAN SALTLAMP
    £12.00
    DOUWE E. 400GPURE GOLD
    £13.99
    GARLIC PRESSPRESS
    £1.50
    QUAVERS 12PKCHEESE
    £3.00
    DORITOS 180GTANGY CHSE
    £3.98
    2 @ £1.99
    BUY ANY 2 FOR £3.00
    LARGE SQUAREGIFTBAG
    -£0.98
    FOXS 150GJAM S/WICH
    £2.00
    WALKERS 14PKR/S & S/V
    £3.00
    Sub Total:
    """

    result = ReceiptExtractionPipeline().run(raw_text)

    assert result.merchant.merchant_name == "B&M"
    assert [item.description for item in result.items.items] == [
        "HIMALAYAN SALTLAMP",
        "DOUWE E. 400GPURE GOLD",
        "GARLIC PRESSPRESS",
        "QUAVERS 12PKCHEESE",
        "DORITOS 180GTANGY CHSE",
        "LARGE SQUAREGIFTBAG",
        "Discount - LARGE SQUAREGIFTBAG",
        "FOXS 150GJAM S/WICH",
        "WALKERS 14PKR/S & S/V",
    ]
    assert [item.total for item in result.items.items] == [
        Decimal("12.00"),
        Decimal("13.99"),
        Decimal("1.50"),
        Decimal("3.00"),
        Decimal("3.98"),
        None,
        Decimal("-0.98"),
        Decimal("2.00"),
        Decimal("3.00"),
    ]
    doritos = next(
        item for item in result.items.items if item.description == "DORITOS 180GTANGY CHSE"
    )
    assert doritos.quantity == Decimal("2")
    assert doritos.unit_price == Decimal("1.99")


def test_pipeline_ignores_office_supplies_header_from_fake_receipt() -> None:
    raw_text = """
    OFFICE SUPPLIES LTD
    Invoice receipt
    06 JUL 2026 16:25
    Notebook Pack                       \u00a312.50
    USB-C Cable                         \u00a39.99
    Printer Paper                       \u00a318.75
    Net total: GBP 41.24
    VAT: GBP 8.25
    Amount due: GBP 49.49
    Paid by card
    """

    result = ReceiptExtractionPipeline().run(raw_text)

    assert [item.description for item in result.items.items] == [
        "Notebook Pack",
        "USB-C Cable",
        "Printer Paper",
    ]
    assert [item.total for item in result.items.items] == [
        Decimal("12.50"),
        Decimal("9.99"),
        Decimal("18.75"),
    ]
    assert result.total.amount == Decimal("49.49")


def test_pipeline_ignores_unknown_header_before_first_item_signal() -> None:
    raw_text = """
    NORTH ROAD MARKET
    12 North Road London
    10 JUL 2026 11:15
    Fresh Berries                       \u00a33.25
    Greek Yoghurt                       \u00a31.80
    TOTAL
    \u00a35.05
    """

    result = ReceiptExtractionPipeline().run(raw_text)

    assert [item.description for item in result.items.items] == [
        "Fresh Berries",
        "Greek Yoghurt",
    ]
    assert [item.total for item in result.items.items] == [
        Decimal("3.25"),
        Decimal("1.80"),
    ]


def test_pipeline_extracts_line_items_with_quantity_unit_price_and_tax_codes() -> None:
    raw_text = """
    ALDI STORES
    123456 Semi Skimmed Milk 1.45 A
    Bananas 0.620kg @ 1.10/kg 0.68
    Croissants 2 x 1.25 2.50 B
    2 x Bakery Roll 1.60
    Sub Total 6.23
    VAT 0.10
    Total GBP 6.33
    Card 1234
    """

    result = ReceiptExtractionPipeline().run(raw_text)

    assert [item.description for item in result.items.items] == [
        "Semi Skimmed Milk",
        "Bananas 0.620kg @ 1.10/kg",
        "Croissants",
        "Bakery Roll",
    ]
    assert [item.quantity for item in result.items.items] == [
        Decimal("1"),
        Decimal("1"),
        Decimal("2"),
        Decimal("2"),
    ]
    assert [item.unit_price for item in result.items.items] == [
        Decimal("1.45"),
        Decimal("0.68"),
        Decimal("1.25"),
        Decimal("0.80"),
    ]
    assert [item.total for item in result.items.items] == [
        Decimal("1.45"),
        Decimal("0.68"),
        Decimal("2.50"),
        Decimal("1.60"),
    ]


def test_pipeline_extracts_aldi_multiline_items_from_qwen_ocr() -> None:
    raw_text = """
    ALDI STORES
    141 Farnham Road
    Slough
    GBP
    417009 EGGS LARGE FR 12PK
    2.89 A
    417009 EGGS LARGE FR 12PK
    2.89 A
    416772 MILK WHOLE 4PT
    1.65 A
    3 X
    0.49
    275192 PEPPERS RED LOOSE
    1.47 A
    339978 SPRING ONIONS
    12:49:33
    Card Number: ************9235
    Visa DEBIT
    Merchant ID: ***40464
    0.49 A
    04/07/26
    Goods: 44.28
    Total: GBP44.28
    Total
    44.28
    32 Items
    Card Sales
    GBP
    44.28
    """

    result = ReceiptExtractionPipeline().run(raw_text)

    assert [item.description for item in result.items.items] == [
        "EGGS LARGE FR 12PK",
        "EGGS LARGE FR 12PK",
        "MILK WHOLE 4PT",
        "PEPPERS RED LOOSE",
        "SPRING ONIONS",
    ]
    assert [item.quantity for item in result.items.items] == [
        Decimal("1"),
        Decimal("1"),
        Decimal("1"),
        Decimal("3"),
        Decimal("1"),
    ]
    assert [item.unit_price for item in result.items.items] == [
        Decimal("2.89"),
        Decimal("2.89"),
        Decimal("1.65"),
        Decimal("0.49"),
        Decimal("0.49"),
    ]
    assert [item.total for item in result.items.items] == [
        Decimal("2.89"),
        Decimal("2.89"),
        Decimal("1.65"),
        Decimal("1.47"),
        Decimal("0.49"),
    ]


def test_pipeline_uses_quantity_unit_price_row_for_one_aldi_item() -> None:
    result = ReceiptExtractionPipeline().run("""
    ALDI STORES
    2 x 2.99
    522983 PEACH 1KG
    5.98 A
    Total 5.98
    """)

    assert [item.description for item in result.items.items] == ["PEACH 1KG"]
    assert [item.quantity for item in result.items.items] == [Decimal("2")]
    assert [item.unit_price for item in result.items.items] == [Decimal("2.99")]
    assert [item.total for item in result.items.items] == [Decimal("5.98")]


def test_pipeline_ignores_receipt_footer_references_that_contain_decimal_dates() -> None:
    raw_text = """
    ALDI STORES
    275192 PEPPERS RED LOOSE
    1.47 A
    *7232 C516/003/050 04.07.26 12:49
    Which? Cheapest supermarket 5 b
    """

    result = ReceiptExtractionPipeline().run(raw_text)

    assert [item.description for item in result.items.items] == ["PEPPERS RED LOOSE"]
    assert [item.total for item in result.items.items] == [Decimal("1.47")]


def test_pipeline_multiplies_quantity_when_ocr_repeats_unit_price_as_total() -> None:
    raw_text = """
    ALDI STORES
    3 X
    0.49
    275192 PEPPERS RED LOOSE
    0.49 A
    Total: GBP1.47
    """

    result = ReceiptExtractionPipeline().run(raw_text)

    assert [item.description for item in result.items.items] == ["PEPPERS RED LOOSE"]
    assert result.items.items[0].quantity == Decimal("3")
    assert result.items.items[0].unit_price == Decimal("0.49")
    assert result.items.items[0].total == Decimal("1.47")


def test_pipeline_extracts_tesco_multiline_items_and_stops_at_subtotal() -> None:
    raw_text = """
    TESCO
    Slough Extra to loco dlaget
    Any questions please visit
    www.tesco.com/store-locator
    VAT Number: GB 220 4302 31
    Tesco Shorties Biscuits 300g
    Orgo Vanilla Cookie Chocolate
    Sandwich Biscuits 154g
    \u00a31.15
    \u00a36.00
    \u00a31.50 each
    -\u00a33.00
    Cc 75p
    \u00a31.70
    Tesco Flat Peach Minimum 4
    Pack
    -\u00a30.70
    Cc \u00a31.00
    1
    Mackie's Dairy Honeycomb Real
    \u20ac3.60
    Dairy Ice Cream 1 Litre
    1 Colgate Total Active
    \u00a310.00
    Prevention Whitening Soft
    Toothbrush 2 Pack
    Cc \u00a35.00
    -\u00a35.00
    2
    Tesco Large Free Range Eggs 12
    \u00a36.60
    Pack
    \u00a33.30 each
    2 Tesco British Whole Milk
    \u00a34.90
    3.4081, 6 Pints
    \u00a32.45 each
    1
    Tesco Ripe Bananas 5 Pack
    \u00a30.78
    Subtotal:
    -\u00a31.00
    vlags.appling\u00a361.03
    TOTAL:
    \u00a344.52
    Card
    \u00a344.52
    """

    result = ReceiptExtractionPipeline().run(raw_text)

    assert [item.description for item in result.items.items] == [
        "Tesco Shorties Biscuits 300g",
        "Orgo Vanilla Cookie Chocolate Sandwich Biscuits 154g",
        "Discount - Orgo Vanilla Cookie Chocolate Sandwich Biscuits 154g",
        "Discount - Tesco Flat Peach Minimum 4 Pack",
        "Mackie's Dairy Honeycomb Real",
        "Colgate Total Active",
        "Discount - Colgate Total Active",
        "Tesco Large Free Range Eggs 12",
        "Tesco British Whole Milk",
        "Tesco Ripe Bananas 5 Pack",
    ]
    assert [item.quantity for item in result.items.items] == [
        Decimal("1"),
        Decimal("4"),
        Decimal("1"),
        Decimal("1"),
        Decimal("1"),
        Decimal("1"),
        Decimal("1"),
        Decimal("2"),
        Decimal("2"),
        Decimal("1"),
    ]
    assert [item.unit_price for item in result.items.items] == [
        Decimal("1.15"),
        Decimal("1.50"),
        Decimal("-3.00"),
        Decimal("-0.70"),
        Decimal("3.60"),
        Decimal("10.00"),
        Decimal("-5.00"),
        Decimal("3.30"),
        Decimal("2.45"),
        Decimal("0.78"),
    ]
    assert [item.total for item in result.items.items] == [
        Decimal("1.15"),
        Decimal("6.00"),
        Decimal("-3.00"),
        Decimal("-0.70"),
        Decimal("3.60"),
        Decimal("10.00"),
        Decimal("-5.00"),
        Decimal("6.60"),
        Decimal("4.90"),
        Decimal("0.78"),
    ]


def test_pipeline_ignores_tesco_header_and_address_from_fake_receipt() -> None:
    raw_text = """
    TESCO EXTRA
    Uxbridge Road Slough
    09 JUL 2026 12:18
    Shorties Biscuits 300g              \u00a31.15
    Vanilla Sandwich Biscuits           \u00a36.00
    Clubcard Saving                    -\u00a33.00
    Flat Peaches                        \u00a31.70
    Clubcard Saving                    -\u00a30.70
    Large Free Range Eggs               \u00a36.60
    British Whole Milk                  \u00a34.90
    Ripe Bananas                        \u00a30.78
    TOTAL
    \u00a317.43
    Card
    \u00a317.43
    """

    result = ReceiptExtractionPipeline().run(raw_text)

    assert [item.description for item in result.items.items] == [
        "Shorties Biscuits 300g",
        "Vanilla Sandwich Biscuits",
        "Discount - Vanilla Sandwich Biscuits",
        "Flat Peaches",
        "Discount - Flat Peaches",
        "Large Free Range Eggs",
        "British Whole Milk",
        "Ripe Bananas",
    ]
    assert [item.total for item in result.items.items] == [
        Decimal("1.15"),
        Decimal("6.00"),
        Decimal("-3.00"),
        Decimal("1.70"),
        Decimal("-0.70"),
        Decimal("6.60"),
        Decimal("4.90"),
        Decimal("0.78"),
    ]
    assert result.total.amount == Decimal("17.43")


def test_pipeline_ignores_sainsburys_address_and_extracts_negative_discount() -> None:
    raw_text = """
    SAINSBURY'S
    Charterhouse Street London EC1M 6HA
    33
    0.08
    Taste the Difference Apples
    \u00a32.00
    Nectar Price
    -\u00a30.50
    TOTAL
    \u00a31.50
    """

    result = ReceiptExtractionPipeline().run(raw_text)

    assert [item.description for item in result.items.items] == [
        "Taste the Difference Apples",
        "Discount - Nectar Price",
    ]
    assert [item.quantity for item in result.items.items] == [
        Decimal("1"),
        Decimal("1"),
    ]
    assert [item.unit_price for item in result.items.items] == [
        Decimal("2.00"),
        Decimal("-0.50"),
    ]
    assert [item.total for item in result.items.items] == [
        Decimal("2.00"),
        Decimal("-0.50"),
    ]
    assert result.total.amount == Decimal("1.50")


def test_pipeline_calculates_sainsburys_total_from_items_when_total_label_missing() -> None:
    raw_text = """
    SAINSBURY'S
    Charterhouse Street London EC1M 6HA
    Taste the Difference Apples
    \u00a32.00
    Nectar Price
    -\u00a30.50
    """

    result = ReceiptExtractionPipeline().run(raw_text)

    assert [item.description for item in result.items.items] == [
        "Taste the Difference Apples",
        "Discount - Nectar Price",
    ]
    assert result.total.amount == Decimal("1.50")
    assert result.total.confidence == 0.65


def test_pipeline_extracts_sainsburys_balance_due_with_leading_item_count() -> None:
    raw_text = """
    SAINSBURY'S
    Taste the Difference Apples
    \u00a32.00
    93 BALANCE DUE
    \u00a3218.85
    Visa DEBIT
    \u00a3218.85
    """

    result = ReceiptExtractionPipeline().run(raw_text)

    assert result.total.amount == Decimal("218.85")
    assert result.total.confidence == 0.75


def test_pipeline_keeps_more_than_fifty_line_items() -> None:
    raw_text = "\n".join(
        ["SAINSBURY'S"]
        + [f"JS ITEM {index:02d}\n\u00a31.00" for index in range(60)]
        + ["TOTAL", "\u00a360.00"]
    )

    result = ReceiptExtractionPipeline().run(raw_text)

    assert len(result.items.items) == 60


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
