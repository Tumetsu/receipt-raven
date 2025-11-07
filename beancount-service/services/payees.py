"""
Service for extracting payees from beancount ledger
"""
from typing import List
from beancount import loader
from beancount.core.data import Transaction
from models import Payee
from utils.logging import get_logger

logger = get_logger(__name__)


def get_payees(ledger_path: str) -> List[Payee]:
    """
    Get all payees (shops, vendors) from the beancount ledger

    Args:
        ledger_path: Path to the beancount ledger file

    Returns:
        List of Payee objects
    """
    entries, errors, options = loader.load_file(ledger_path)

    if errors:
        logger.warning("beancount_loader_errors", error_count=len(errors), errors=str(errors)[:200])

    # Extract unique payees from transactions
    payees = set()
    for entry in entries:
        if isinstance(entry, Transaction) and entry.payee:
            payees.add(entry.payee)

    return [Payee(name=payee) for payee in sorted(payees)]
