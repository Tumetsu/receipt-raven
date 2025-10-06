"""
Service for extracting payees from beancount ledger
"""
from typing import List
from beancount import loader
from beancount.core.data import Transaction
from models import Payee


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
        print(f"Beancount loader errors: {errors}")

    # Extract unique payees from transactions
    payees = set()
    for entry in entries:
        if isinstance(entry, Transaction) and entry.payee:
            payees.add(entry.payee)

    return [Payee(name=payee) for payee in sorted(payees)]
