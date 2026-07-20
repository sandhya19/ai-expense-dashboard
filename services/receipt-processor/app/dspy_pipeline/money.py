import re
from decimal import Decimal, InvalidOperation

_AMOUNT_PATTERN = (
    r"(?:GBP|USD|EUR)?\s*[\u00a3$\u20ac]?\s*"
    r"([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})|[0-9]+(?:\.[0-9]{2})?)"
)
_LINE_AMOUNT_PATTERN = re.compile(rf"^\s*(?:{_AMOUNT_PATTERN})", re.I)


def parse_money_amount(value: str) -> Decimal | None:
    normalized = value.replace(",", "")
    try:
        return Decimal(normalized)
    except InvalidOperation:
        return None


def find_labeled_amount(
    text: str,
    labels: list[str],
    ignored_terms: list[str] | None = None,
) -> Decimal | None:
    label_pattern = "|".join(re.escape(label) for label in labels)
    optional_leading_count = r"(?:\d+\s+)?"
    same_line_pattern = re.compile(
        rf"^\s*{optional_leading_count}(?:{label_pattern})\b[^\n\d\u00a3$\u20ac]*(?:{_AMOUNT_PATTERN})",
        re.I,
    )
    label_only_pattern = re.compile(
        rf"^\s*{optional_leading_count}(?:{label_pattern})\b[^\d\u00a3$\u20ac]*$",
        re.I,
    )
    ignored_terms = ignored_terms or []
    lines = text.splitlines()

    for index, line in enumerate(lines):
        normalized_line = line.lower()
        if any(term in normalized_line for term in ignored_terms):
            continue

        match = same_line_pattern.search(line)
        if match:
            amount = parse_money_amount(match.group(1))
            if amount is not None:
                return amount

        if label_only_pattern.search(line):
            for next_line in lines[index + 1 :]:
                if not next_line.strip():
                    continue
                next_match = _LINE_AMOUNT_PATTERN.search(next_line)
                if next_match:
                    amount = parse_money_amount(next_match.group(1))
                    if amount is not None:
                        return amount
                break

    return None
