# 💳 Interswitch Webpay Test Cards (QA / Sandbox)

Use these card numbers to simulate successful and failed transactions in the **newwebpay** environment while `mode: "TEST"` is active.

## ✅ Successful Transaction Simulations
| Card Type | Card Number | Expiry | CVV | PIN | OTP |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Visa** (16 digits) | `4000 0000 0000 2503` | `03/50` | `111` | `1111` | `123456` |
| **Verve** (19 digits) | `5061 0502 5475 6707 864` | `06/26` | `111` | `1111` | `123456` |
| **Mastercard** (16) | `5123 4500 0000 0008` | `01/39` | `100` | `1111` | `123456` |

---

## ❌ Failure & Error Simulations
| Scenario | Card Number | Expected Response |
| :--- | :--- | :--- |
| **Insufficient Funds** | `5061 0000 0000 0002 120` | Returns `51` (Decline) |
| **Timeout / Server Error** | `5061 0000 0000 0002 130` | Returns `06` (Error) |
| **Transaction Cancelled** | *Any* | Click "**X**" or "**Cancel**" in widget (Returns `Z6`) |

---

## 💡 Quick Integration Notes
- **Luhn Check**: Always ensure you enter the digits exactly as shown; some Verve cards are 19 digits and might be rejected if a digit is missing.
- **Environment**: These cards ONLY work on the **QA Node** (`https://qa.interswitchng.com`) or with `mode: "TEST"` set in the checkout parameters.
- **OTP Simulation**: If the widget asks for an OTP, any 6-digit number (e.g., `123456`) usually works in the sandbox.

---
*Created for EsuX Delta-77 Integration*
