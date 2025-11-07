"""
Service for calculating monthly expenses from beancount ledger
"""
from datetime import datetime, date
from decimal import Decimal
from typing import Dict
from beancount import loader
from beancount.core import amount
from beancount.core.data import Transaction, TxnPosting
from utils.logging import get_logger

logger = get_logger(__name__)


def get_current_month_expenses(ledger_path: str) -> Dict[str, float]:
    """
    Calculate total expenses for the current month

    Args:
        ledger_path: Path to the beancount ledger file

    Returns:
        Dictionary with total expenses per currency
    """
    entries, errors, options = loader.load_file(ledger_path)

    if errors:
        # Log errors but continue
        logger.warning("beancount_loader_errors", error_count=len(errors), errors=str(errors)[:200])

    # Get current month's start and end dates
    now = datetime.now()
    current_month_start = date(now.year, now.month, 1)

    # Calculate next month's start date (end of current month)
    if now.month == 12:
        next_month_start = date(now.year + 1, 1, 1)
    else:
        next_month_start = date(now.year, now.month + 1, 1)

    # Accumulate expenses by currency
    expenses_by_currency: Dict[str, Decimal] = {}

    # Iterate through all transactions
    for entry in entries:
        if not isinstance(entry, Transaction):
            continue

        # Check if transaction is in current month
        if not (current_month_start <= entry.date < next_month_start):
            continue

        # Process all postings in the transaction
        for posting in entry.postings:
            if posting.account and posting.account.startswith("Expenses:"):
                # This is an expense posting
                if posting.units:
                    currency = posting.units.currency
                    amount_value = posting.units.number

                    if currency not in expenses_by_currency:
                        expenses_by_currency[currency] = Decimal(0)

                    expenses_by_currency[currency] += amount_value

    # Convert Decimal to float for JSON serialization
    return {
        currency: float(total)
        for currency, total in expenses_by_currency.items()
    }
