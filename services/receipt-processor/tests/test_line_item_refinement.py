from decimal import Decimal

from app.services.line_item_refinement import _json_from_model_response


def test_refinement_json_accepts_discounts_and_requires_totals() -> None:
    result = _json_from_model_response(
        """```json
        {"items":[
          {"description":"Doritos","quantity":2,"unit_price":1.99,"total":3.98},
          {"description":"Discount - Doritos","quantity":1,"unit_price":-0.98,"total":-0.98}
        ]}
        ```"""
    )

    assert result is not None
    assert [item.total for item in result.items] == [Decimal("3.98"), Decimal("-0.98")]


def test_refinement_json_rejects_items_without_a_total() -> None:
    assert _json_from_model_response(
        '{"items":[{"description":"Gift bag","quantity":1,"unit_price":null,"total":null}]}'
    ) is None
