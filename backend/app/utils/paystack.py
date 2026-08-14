"""Paystack payment verification helper.

Server-side verification is the ONLY trustworthy way to confirm a payment.
The browser callback can be spoofed, so we never mark a donation completed
until Paystack itself confirms the transaction succeeded.
"""
import requests
from flask import current_app

PAYSTACK_VERIFY_URL = "https://api.paystack.co/transaction/verify/{reference}"


class PaystackError(Exception):
    """Raised when a payment cannot be verified or the gateway errors."""


def verify_transaction(reference: str) -> dict:
    """Verify a Paystack transaction by its reference.

    Returns a normalized dict on success:
        {"amount": <float major units>, "currency": str, "email": str,
         "reference": str, "paid_at": str, "channel": str}

    Raises PaystackError if the key is missing, the gateway is unreachable,
    or the transaction did not succeed.
    """
    secret = current_app.config.get("PAYSTACK_SECRET_KEY", "")
    if not secret:
        raise PaystackError("Payment gateway is not configured (missing secret key).")

    if not reference:
        raise PaystackError("Missing payment reference.")

    try:
        resp = requests.get(
            PAYSTACK_VERIFY_URL.format(reference=reference),
            headers={"Authorization": f"Bearer {secret}"},
            timeout=15,
        )
    except requests.RequestException as exc:
        raise PaystackError(f"Could not reach payment gateway: {exc}") from exc

    if resp.status_code != 200:
        raise PaystackError(
            f"Payment gateway returned {resp.status_code} while verifying payment."
        )

    payload = resp.json()
    if not payload.get("status"):
        raise PaystackError(payload.get("message", "Verification failed."))

    data = payload.get("data", {})
    if data.get("status") != "success":
        raise PaystackError(
            f"Payment not successful (status: {data.get('status', 'unknown')})."
        )

    # Paystack returns amount in minor units (kobo/pesewas/cents).
    return {
        "amount": (data.get("amount", 0) or 0) / 100.0,
        "currency": data.get("currency", "NGN"),
        "email": (data.get("customer") or {}).get("email"),
        "reference": data.get("reference"),
        "paid_at": data.get("paid_at"),
        "channel": data.get("channel"),
    }
