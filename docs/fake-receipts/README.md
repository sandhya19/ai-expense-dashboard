# Fake Receipts

Use these PNG files to test receipt upload and extraction flows.

| File | Expected merchant | Expected total |
| --- | --- | ---: |
| `sainsburys-balance-due.png` | Sainsbury's | GBP 218.85 |
| `tesco-clubcard.png` | Tesco | GBP 17.43 |
| `aldi-groceries.png` | Aldi Stores | GBP 9.39 |
| `pret-lunch.png` | Pret A Manger | GBP 14.52 |
| `office-supplies.png` | Office Supplies Ltd | GBP 49.49 |

The Sainsbury's sample includes the OCR pattern:

```text
93 BALANCE DUE
£218.85
Visa DEBIT
£218.85
```

That case verifies extraction of totals when a leading item count appears before `BALANCE DUE`.
