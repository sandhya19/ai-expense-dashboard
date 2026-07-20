import re
from decimal import Decimal

from app.dspy_pipeline.known_foods import normalise_known_indian_food
from app.dspy_pipeline.money import parse_money_amount
from app.models.dspy import ItemsOutput, LineItemOutput, OCRTextInput

_MONEY_PATTERN = (
    r"(?<![A-Za-z0-9])"
    r"(?:"
    r"(?:GBP|USD|EUR)?\s*[\u00a3$\u20ac]?\s*"
    r"[0-9]{1,3}(?:,[0-9]{3})*\.[0-9]{2}|"
    r"(?:GBP|USD|EUR)?\s*[\u00a3$\u20ac]?\s*[0-9]+\.[0-9]{2}"
    r")"
    r"(?![A-Za-z0-9])"
)
_MONEY_TOKEN_PATTERN = re.compile(_MONEY_PATTERN, re.I)
_QUANTITY_UNIT_TOTAL_PATTERN = re.compile(
    rf"(?P<quantity>\d+(?:\.\d+)?)\s*(?:x|@)\s*(?P<unit_price>{_MONEY_PATTERN})"
    rf"\s+(?P<total>{_MONEY_PATTERN})(?:\s+[A-Z])?\s*$",
    re.I,
)
_LEADING_QUANTITY_PATTERN = re.compile(
    rf"^\s*(?P<quantity>\d+(?:\.\d+)?)\s*x\s+"
    rf"(?P<description>.+?)\s+(?P<total>{_MONEY_PATTERN})(?:\s+[A-Z])?\s*$",
    re.I,
)
_TRAILING_TAX_CODE_PATTERN = re.compile(r"\s+[A-Z]\s*$")
_LEADING_ITEM_CODE_PATTERN = re.compile(r"^(?:\d{3,}|\d+\s+)[\s-]+")
_PRODUCT_CODE_DESCRIPTION_PATTERN = re.compile(r"^\s*\d{3,}\s+(?P<description>.+?)\s*$")
_QUANTITY_DESCRIPTION_PATTERN = re.compile(
    r"^\s*(?P<quantity>\d{1,2}(?:\.\d+)?)\s+(?P<description>[A-Za-z].+?)\s*$", re.I
)
_QUANTITY_ONLY_PATTERN = re.compile(r"^\s*(?P<quantity>\d{1,2})(?:\s*x)?\s*$", re.I)
_PRICE_ONLY_PATTERN = re.compile(rf"^\s*(?P<amount>{_MONEY_PATTERN})(?:\s+[A-Z])?\s*$", re.I)
_SIGNED_PRICE_ONLY_PATTERN = re.compile(
    rf"^\s*(?P<sign>-)?\s*(?P<amount>{_MONEY_PATTERN})(?:\s+[A-Z])?\s*$", re.I
)
_UNIT_PRICE_ONLY_PATTERN = re.compile(
    rf"^\s*(?P<amount>{_MONEY_PATTERN})\s+each\s*$", re.I
)
_QUANTITY_AT_UNIT_PRICE_PATTERN = re.compile(
    r"^\s*(?P<quantity>\d+(?:\.\d+)?)\s*(?:x|@)\s*"
    r"(?P<unit_price>(?:GBP|USD|EUR)?\s*[\u00a3$\u20ac]?\s*\d+(?:\.\d{2})?)\s*$",
    re.I,
)
_DISCOUNT_LINE_PATTERN = re.compile(r"^\s*-|-\s*(?:GBP|USD|EUR)?\s*[\u00a3$\u20ac]", re.I)
_DISCOUNT_LABEL_PATTERN = re.compile(
    r"^\s*(?:\d+\s*x\s+)?(?:clubcard saving|nectar price saving|item cancelled)\b", re.I
)
_PROMOTION_LABEL_PATTERN = re.compile(
    r"^\s*(?:buy any|multisave|mix and match|any \d+ for)\b", re.I
)
_ITEM_SECTION_END_PATTERN = re.compile(
    r"^\s*(?:"
    r"subtotal|sub total|amount excluding vat|amount including vat|"
    r"savings|promotions|total|total due|grand total|amount due|"
    r"amount payable|goods|balance due"
    r")\b",
    re.I,
)
_MONTH_DATE_PATTERN = re.compile(
    r"\b\d{1,2}\s+"
    r"(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*"
    r"\s+\d{2,4}\b",
    re.I,
)
_TIME_PATTERN = re.compile(r"\b\d{1,2}:\d{2}(?::\d{2})?\b")
_DOTTED_DATE_PATTERN = re.compile(r"\b\d{1,2}\.\d{1,2}\.\d{2,4}\b")
_REFERENCE_LINE_PATTERN = re.compile(r"^\s*\*|[A-Z0-9]+/\d{2,}/\d{2,}", re.I)
_UK_POSTCODE_PATTERN = re.compile(r"[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b", re.I)

_IGNORED_TERMS = {
    "aid",
    "amount due",
    "authorisation",
    "authorisation code",
    "balance",
    "card",
    "cash",
    "change",
    "checkout",
    "clubcard",
    "clubcard points",
    "contactless",
    "credit",
    "debit",
    "discount",
    "goods",
    "invoice",
    "merchant",
    "merchant id",
    "net total",
    "number",
    "order",
    "pan sequence",
    "pan sequence no",
    "payment",
    "receipt",
    "reference",
    "refund",
    "terminal",
    "terminal id",
    "subtotal",
    "sub total",
    "savings",
    "promotions",
    "tax",
    "total",
    "total to pay",
    "vat",
}
_IGNORED_EXACT_LINES = {
    "aldi stores",
    "good food for all of us",
    "office supplies ltd",
    "sales voucher",
    "name qty amount",
    "pret a manger",
    "sainsbury's",
    "sainsbury's supermarkets ltd",
    "smartshop",
    "slough extra lay",
    "slough uxbridge road",
    "tesco",
    "tesco extra",
    "visa debit",
}
_IGNORED_LINE_FRAGMENTS = {
    "any questions please visit",
    "charterhouse street",
    "sainsburys.co.uk",
    "slough extra",
    "store-locator",
    "uxbridge road",
    "invoice receipt",
    "london liverpool street",
}


def _looks_like_metadata(description: str) -> bool:
    normalized = description.strip().lower().rstrip(":")
    if normalized in _IGNORED_EXACT_LINES:
        return True
    if any(fragment in normalized for fragment in _IGNORED_LINE_FRAGMENTS):
        return True
    if re.fullmatch(r"\d{8,}", normalized):
        return True
    if normalized.startswith(("cc ", "www.", "http")):
        return True
    if normalized in _IGNORED_TERMS:
        return True
    if _PROMOTION_LABEL_PATTERN.match(normalized):
        return True
    if any(
        normalized.startswith(f"{term} ") or normalized.startswith(f"{term}:")
        for term in _IGNORED_TERMS
    ):
        return True
    if re.search(r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b", normalized):
        return True
    if _DOTTED_DATE_PATTERN.search(normalized):
        return True
    if _MONTH_DATE_PATTERN.search(normalized):
        return True
    if _TIME_PATTERN.search(normalized):
        return True
    if _REFERENCE_LINE_PATTERN.search(normalized):
        return True
    if _UK_POSTCODE_PATTERN.search(normalized):
        return True
    return False


def _parse_money_token(value: str) -> Decimal | None:
    normalized = re.sub(r"^(?:GBP|USD|EUR)\s*", "", value.strip(), flags=re.I)
    normalized = normalized.replace("\u00a3", "").replace("$", "").replace("\u20ac", "")
    return parse_money_amount(normalized.strip())


def _clean_description(value: str) -> str:
    description = re.sub(r"\s+", " ", value)
    description = _LEADING_ITEM_CODE_PATTERN.sub("", description)
    description = description.strip(" -:\t")
    return normalise_known_indian_food(description)


def _valid_description(description: str) -> bool:
    if not description or len(description) < 2:
        return False
    if not re.search(r"[A-Za-z]", description):
        return False
    if _looks_like_metadata(description):
        return False
    return True


def _with_quantity_defaults(item: LineItemOutput) -> LineItemOutput:
    if item.total is None:
        return item

    if item.quantity is None:
        item.quantity = Decimal("1")

    if item.unit_price is None and item.quantity > Decimal("0"):
        item.unit_price = (item.total / item.quantity).quantize(Decimal("0.01"))
    elif item.unit_price is not None and item.quantity > Decimal("1"):
        expected_total = (item.unit_price * item.quantity).quantize(Decimal("0.01"))
        if item.total == item.unit_price:
            item.total = expected_total

    return item


def _discount_item(description: str, amount: Decimal) -> LineItemOutput:
    discount = -abs(amount)
    return LineItemOutput(
        description=f"Discount - {description}",
        quantity=Decimal("1"),
        unit_price=discount,
        total=discount,
    )


def _extract_line_item(line: str) -> LineItemOutput | None:
    normalized_line = re.sub(r"\s+", " ", line).strip()
    if not normalized_line:
        return None
    if _DISCOUNT_LINE_PATTERN.search(normalized_line):
        return None

    leading_quantity = _LEADING_QUANTITY_PATTERN.match(normalized_line)
    if leading_quantity:
        description = _clean_description(leading_quantity.group("description"))
        total = _parse_money_token(leading_quantity.group("total"))
        quantity = Decimal(leading_quantity.group("quantity"))
        if _valid_description(description) and total is not None and total > Decimal("0"):
            return _with_quantity_defaults(
                LineItemOutput(description=description, quantity=quantity, total=total)
            )

    quantity_unit_total = _QUANTITY_UNIT_TOTAL_PATTERN.search(normalized_line)
    if quantity_unit_total:
        description = _clean_description(normalized_line[: quantity_unit_total.start()])
        quantity = Decimal(quantity_unit_total.group("quantity"))
        unit_price = _parse_money_token(quantity_unit_total.group("unit_price"))
        total = _parse_money_token(quantity_unit_total.group("total"))
        if _valid_description(description) and total is not None and total > Decimal("0"):
            return _with_quantity_defaults(
                LineItemOutput(
                    description=description,
                    quantity=quantity,
                    unit_price=unit_price,
                    total=total,
                )
            )

    money_matches = list(_MONEY_TOKEN_PATTERN.finditer(normalized_line))
    if not money_matches:
        return None

    total_match = money_matches[-1]
    if total_match.start() > 0 and normalized_line[total_match.start() - 1] == "-":
        return None
    description = _clean_description(normalized_line[: total_match.start()])
    description = _TRAILING_TAX_CODE_PATTERN.sub("", description).strip()
    total = _parse_money_token(total_match.group(0))

    if not _valid_description(description) or total is None or total <= Decimal("0"):
        return None

    return _with_quantity_defaults(LineItemOutput(description=description, total=total))


def _extract_description_only(line: str) -> str | None:
    match = _PRODUCT_CODE_DESCRIPTION_PATTERN.match(line)
    if not match:
        return None

    description = _clean_description(match.group("description"))
    if not _valid_description(description):
        return None
    return description


def _extract_quantity_description(line: str) -> tuple[Decimal | None, str | None]:
    match = _QUANTITY_DESCRIPTION_PATTERN.match(line)
    if not match:
        return None, None

    description = _clean_description(match.group("description"))
    if not _valid_description(description):
        return None, None
    return Decimal(match.group("quantity")), description


def _looks_like_description_line(line: str) -> bool:
    if re.match(r"^\d", line.strip()):
        return False
    description = _clean_description(line)
    if not _valid_description(description):
        return False
    if _MONEY_TOKEN_PATTERN.search(description):
        return False
    return True


def _quantity_from_total_and_unit_price(total: Decimal, unit_price: Decimal) -> Decimal | None:
    if unit_price <= Decimal("0"):
        return None

    quantity = total / unit_price
    if quantity == quantity.to_integral_value():
        return quantity
    return None


class ItemExtractionModule:
    """Extract line items from OCR text."""

    def run(self, input_data: OCRTextInput) -> ItemsOutput:
        items: list[LineItemOutput] = []
        started_items = False
        pending_description: str | None = None
        pending_description_lines: list[str] = []
        pending_discount_description: str | None = None
        pending_quantity: Decimal | None = None
        pending_unit_price: Decimal | None = None
        discard_next_discount = False
        unassigned_total: Decimal | None = None
        lines = input_data.raw_text.splitlines()

        def flush_pending_description() -> None:
            nonlocal pending_description
            if pending_description_lines:
                pending_description = _clean_description(" ".join(pending_description_lines))
                pending_description_lines.clear()

        def starts_multiline_item(index: int) -> bool:
            checked = 0
            for next_line in lines[index + 1 :]:
                next_normalized = re.sub(r"\s+", " ", next_line).strip()
                if not next_normalized:
                    continue
                if _looks_like_metadata(next_normalized):
                    return False
                if _PRICE_ONLY_PATTERN.match(next_normalized):
                    return True
                if _extract_line_item(next_normalized) is not None:
                    return False
                checked += 1
                if checked >= 3:
                    return False
            return False

        def starts_quantity_item(index: int) -> bool:
            for next_line in lines[index + 1 :]:
                next_normalized = re.sub(r"\s+", " ", next_line).strip()
                if not next_normalized:
                    continue
                return bool(_PRICE_ONLY_PATTERN.match(next_normalized))
            return False

        for index, line in enumerate(lines):
            normalized_line = re.sub(r"\s+", " ", line).strip()
            if not normalized_line:
                continue
            if _ITEM_SECTION_END_PATTERN.match(normalized_line):
                break
            is_discount = _DISCOUNT_LINE_PATTERN.search(normalized_line)
            is_clubcard_adjustment = normalized_line.lower().startswith("cc ")
            is_discount_label = _DISCOUNT_LABEL_PATTERN.match(normalized_line)
            is_promotion_label = _PROMOTION_LABEL_PATTERN.match(normalized_line)
            signed_price_match = _SIGNED_PRICE_ONLY_PATTERN.match(normalized_line)
            if is_promotion_label:
                pending_description = None
                pending_description_lines.clear()
                pending_discount_description = None
                pending_quantity = None
                pending_unit_price = None
                unassigned_total = None
                discard_next_discount = True
                continue
            if is_discount_label:
                amount = None
                if signed_price_match:
                    amount = _parse_money_token(signed_price_match.group("amount"))
                else:
                    money_matches = list(_MONEY_TOKEN_PATTERN.finditer(normalized_line))
                    if money_matches:
                        money_match = money_matches[-1]
                        if normalized_line[: money_match.start()].rstrip().endswith("-"):
                            amount = _parse_money_token(money_match.group(0))
                if amount is not None and amount > Decimal("0") and items:
                    items.append(_discount_item(items[-1].description, amount))
                pending_description = None
                pending_description_lines.clear()
                pending_discount_description = (
                    items[-1].description if items else "Nectar Price Saving"
                )
                pending_quantity = None
                pending_unit_price = None
                unassigned_total = None
                continue
            if is_discount and signed_price_match:
                amount = _parse_money_token(signed_price_match.group("amount"))
                if amount is not None and amount > Decimal("0"):
                    flush_pending_description()
                    if discard_next_discount and pending_description is not None:
                        items.append(
                            LineItemOutput(
                                description=pending_description,
                                quantity=Decimal("1"),
                            )
                        )
                        items.append(_discount_item(pending_description, amount))
                    elif pending_discount_description is not None:
                        items.append(_discount_item(pending_discount_description, amount))
                    elif pending_description is not None:
                        items.append(_discount_item(pending_description, amount))
                    elif items:
                        items.append(_discount_item(items[-1].description, amount))
                pending_description = None
                pending_description_lines.clear()
                pending_discount_description = None
                pending_quantity = None
                pending_unit_price = None
                discard_next_discount = False
                unassigned_total = None
                continue
            if is_clubcard_adjustment:
                pending_description = None
                pending_description_lines.clear()
                pending_discount_description = None
                pending_quantity = None
                pending_unit_price = None
                discard_next_discount = False
                continue
            if _looks_like_metadata(normalized_line):
                continue

            quantity_at_unit_price_match = _QUANTITY_AT_UNIT_PRICE_PATTERN.match(normalized_line)
            if quantity_at_unit_price_match:
                quantity = Decimal(quantity_at_unit_price_match.group("quantity"))
                unit_price = _parse_money_token(quantity_at_unit_price_match.group("unit_price"))
                expected_total = unit_price * quantity if unit_price is not None else None
                if (
                    items
                    and expected_total is not None
                    and unassigned_total is None
                    and items[-1].total == expected_total
                ):
                    items[-1].quantity = quantity
                    items[-1].unit_price = unit_price
                    pending_quantity = None
                    pending_unit_price = None
                    unassigned_total = None
                else:
                    pending_quantity = quantity
                    pending_unit_price = unit_price
                continue

            quantity_match = _QUANTITY_ONLY_PATTERN.match(normalized_line)
            if quantity_match:
                quantity = Decimal(quantity_match.group("quantity"))
                if quantity > Decimal("20"):
                    pending_quantity = None
                    pending_unit_price = None
                    continue
                if (
                    not started_items
                    and not pending_description_lines
                    and not starts_quantity_item(index)
                ):
                    continue
                pending_quantity = quantity
                pending_unit_price = None
                continue

            price_only_match = _PRICE_ONLY_PATTERN.match(normalized_line)
            if price_only_match:
                amount = _parse_money_token(price_only_match.group("amount"))
                if amount is None or amount <= Decimal("0"):
                    continue

                if pending_description_lines and len(pending_description_lines) > 1:
                    pending_description = _clean_description(pending_description_lines.pop(0))
                    pending_description_lines = [
                        _clean_description(" ".join(pending_description_lines))
                    ]
                else:
                    flush_pending_description()
                if pending_description is not None:
                    items.append(
                        _with_quantity_defaults(
                            LineItemOutput(
                                description=pending_description,
                                quantity=pending_quantity,
                                unit_price=pending_unit_price,
                                total=amount,
                            )
                        )
                    )
                    started_items = True
                    if pending_description_lines:
                        pending_description = _clean_description(
                            " ".join(pending_description_lines)
                        )
                    else:
                        pending_description = None
                    pending_discount_description = None
                    pending_quantity = None
                    pending_unit_price = None
                    unassigned_total = None
                    continue

                if pending_quantity is not None and pending_unit_price is None:
                    pending_unit_price = amount
                    continue

                unassigned_total = amount
                continue

            unit_price_match = _UNIT_PRICE_ONLY_PATTERN.match(normalized_line)
            if unit_price_match:
                unit_price = _parse_money_token(unit_price_match.group("amount"))
                last_total = items[-1].total if items else None
                if (
                    unit_price is not None
                    and pending_description is None
                    and not pending_description_lines
                    and last_total is not None
                ):
                    inferred_quantity = _quantity_from_total_and_unit_price(
                        last_total, unit_price
                    )
                    if inferred_quantity is not None:
                        items[-1].quantity = inferred_quantity
                        items[-1].unit_price = unit_price
                    continue
                if pending_unit_price is None:
                    pending_unit_price = unit_price
                    continue

            item = _extract_line_item(line)
            if item is not None:
                if item.quantity is None and pending_quantity is not None:
                    item.quantity = pending_quantity
                if item.unit_price is None and pending_unit_price is not None:
                    item.unit_price = pending_unit_price
                items.append(_with_quantity_defaults(item))
                started_items = True
                pending_description = None
                pending_description_lines.clear()
                pending_discount_description = None
                pending_quantity = None
                pending_unit_price = None
                unassigned_total = None
                continue

            quantity_description, quantity_description_text = _extract_quantity_description(
                normalized_line
            )
            if quantity_description_text is not None:
                if not started_items and not starts_multiline_item(index):
                    continue
                pending_quantity = quantity_description
                pending_unit_price = None
                pending_description_lines = [quantity_description_text]
                pending_description = quantity_description_text
                continue

            description = _extract_description_only(normalized_line)
            if description is not None:
                if not started_items and not starts_multiline_item(index):
                    continue
                pending_description = description
                pending_description_lines = [description]
                continue

            if _looks_like_description_line(normalized_line):
                if not started_items and not starts_multiline_item(index):
                    continue
                pending_description_lines.append(_clean_description(normalized_line))

        confidence = 0.75 if items else 0
        return ItemsOutput(items=items[:200], confidence=confidence)
