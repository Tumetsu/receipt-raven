"""
Service for creating and submitting transactions to beancount ledger
"""
from typing import Optional
from datetime import datetime
from decimal import Decimal
from beancount.core import data, amount
from beancount.parser import printer
from beancount.loader import load_file
from beancount.core.getters import get_accounts
from models import Transaction, ReceiptTransactionData, TransactionSubmitResponse


def create_beancount_transaction(txn: Transaction) -> data.Transaction:
    """
    Create a beancount Transaction object from our Transaction model

    Args:
        txn: Transaction model

    Returns:
        beancount Transaction object

    Raises:
        ValueError: If transaction data is invalid
    """
    # Parse the date
    date_parts = txn.date.split("-")
    txn_date = datetime(
        int(date_parts[0]), int(date_parts[1]), int(date_parts[2])
    ).date()

    # Create postings
    postings = []
    for posting in txn.postings:
        currency = posting.currency or "EUR"
        amt = amount.Amount(Decimal(str(posting.amount)), currency)

        # Create metadata for posting if there's a comment
        posting_meta = {}
        if posting.comment:
            posting_meta["comment"] = posting.comment

        bean_posting = data.Posting(
            account=posting.account,
            units=amt,
            cost=None,
            price=None,
            flag=None,
            meta=posting_meta if posting_meta else None,
        )
        postings.append(bean_posting)

    # Create tags and links
    tags = set(txn.tags) if txn.tags else set()
    links = set(txn.links) if txn.links else set()

    # Create metadata
    meta = {}
    if txn.metadata:
        meta.update(txn.metadata)

    # Create the transaction
    bean_txn = data.Transaction(
        meta=meta,
        date=txn_date,
        flag="*",
        payee=txn.payee,
        narration=txn.narration,
        tags=tags,
        links=links,
        postings=postings,
    )

    return bean_txn


def validate_transaction(bean_txn: data.Transaction) -> tuple[bool, Optional[str]]:
    """
    Validate that a transaction balances correctly

    Args:
        bean_txn: beancount Transaction object

    Returns:
        Tuple of (is_valid, error_message)
    """
    # Group postings by currency
    currency_totals = {}

    for posting in bean_txn.postings:
        if posting.units is None:
            # Empty posting - beancount will auto-balance this
            continue

        currency = posting.units.currency
        if currency not in currency_totals:
            currency_totals[currency] = Decimal("0")

        currency_totals[currency] += posting.units.number

    # Check that each currency balances (sums to zero)
    # Allow a small tolerance for rounding errors
    tolerance = Decimal("0.005")

    for currency, total in currency_totals.items():
        if abs(total) > tolerance:
            return False, f"Transaction does not balance for {currency}: sum is {total} (should be 0)"

    # If there's an empty posting, that's fine - it will be auto-balanced
    # If there's no empty posting, all currencies should sum to zero (which we checked above)

    return True, None


def validate_accounts_exist(
    bean_txn: data.Transaction, ledger_path: str
) -> tuple[bool, Optional[str]]:
    """
    Validate that all accounts referenced in the transaction exist in the ledger

    Args:
        bean_txn: beancount Transaction object
        ledger_path: Path to the ledger file

    Returns:
        Tuple of (is_valid, error_message)
    """
    # Load the ledger to get all defined accounts
    entries, errors, options = load_file(ledger_path)

    if errors:
        # If there are parse errors in the ledger, we should still try to validate
        # but log this for debugging
        pass

    # Get all account names that have been opened in the ledger
    valid_accounts = get_accounts(entries)

    # Check each posting's account
    invalid_accounts = []
    for posting in bean_txn.postings:
        if posting.account not in valid_accounts:
            invalid_accounts.append(posting.account)

    if invalid_accounts:
        return False, f"Invalid account(s): {', '.join(invalid_accounts)}. These accounts do not exist in the ledger."

    return True, None


def create_receipt_transaction(receipt_data: ReceiptTransactionData) -> Transaction:
    """
    Convert receipt data into a beancount transaction

    Args:
        receipt_data: Receipt transaction data

    Returns:
        Transaction object
    """
    currency = receipt_data.currency or "EUR"
    postings = []

    # Create postings for each item
    for item in receipt_data.items:
        # Determine expense account
        if item.expense_account:
            expense_account = item.expense_account
        else:
            # Default to a generic expense account with the category
            expense_account = f"{item.category}"

        postings.append(
            {
                "account": expense_account,
                "amount": item.price,
                "currency": currency,
                "comment": item.name,
            }
        )

    # Add the source account posting (negative, as money is leaving)
    postings.append(
        {
            "account": receipt_data.source_account,
            "amount": -receipt_data.total,
            "currency": currency,
        }
    )

    # Create transaction
    transaction = Transaction(
        date=receipt_data.date,
        payee=receipt_data.payee,
        narration=f"Receipt #{receipt_data.receipt_id}",
        postings=postings,
        tags=["receipt-raven"],
        metadata={"receipt_id": str(receipt_data.receipt_id)},
    )

    return transaction


def submit_transaction(
    transaction: Transaction, ledger_path: str, dry_run: bool = False
) -> TransactionSubmitResponse:
    """
    Submit a transaction to the beancount ledger

    Args:
        transaction: Transaction to submit
        ledger_path: Path to the ledger file
        dry_run: If True, only validate without writing

    Returns:
        TransactionSubmitResponse with success status
    """
    try:
        # Create beancount transaction object
        bean_txn = create_beancount_transaction(transaction)

        # Validate that the transaction balances
        is_valid, error_message = validate_transaction(bean_txn)
        if not is_valid:
            return TransactionSubmitResponse(
                success=False, message=f"Transaction validation failed: {error_message}"
            )

        # Validate that all accounts exist in the ledger
        is_valid, error_message = validate_accounts_exist(bean_txn, ledger_path)
        if not is_valid:
            return TransactionSubmitResponse(
                success=False, message=f"Account validation failed: {error_message}"
            )

        # Format using beancount's printer for proper formatting
        formatted_txn = printer.format_entry(bean_txn)

        if dry_run:
            # Just return the formatted transaction for validation
            return TransactionSubmitResponse(
                success=True,
                message="Dry run - transaction validated and balances correctly",
                transaction_id=None,
            )

        # Append to ledger file
        with open(ledger_path, "a", encoding="utf-8") as f:
            f.write("\n")
            f.write(formatted_txn)
            f.write("\n")

        # Generate transaction ID (using date + payee as identifier)
        transaction_id = f"{transaction.date}_{transaction.payee}"

        return TransactionSubmitResponse(
            success=True,
            message="Transaction submitted successfully",
            transaction_id=transaction_id,
        )

    except Exception as e:
        return TransactionSubmitResponse(
            success=False, message=f"Failed to submit transaction: {str(e)}"
        )


def submit_receipt_transaction(
    receipt_data: ReceiptTransactionData, ledger_path: str, dry_run: bool = False
) -> TransactionSubmitResponse:
    """
    Convert receipt data to transaction and submit to ledger

    Args:
        receipt_data: Receipt transaction data
        ledger_path: Path to the ledger file
        dry_run: If True, only validate without writing

    Returns:
        TransactionSubmitResponse with success status
    """
    try:
        # Create transaction from receipt data
        transaction = create_receipt_transaction(receipt_data)

        # Submit the transaction
        return submit_transaction(transaction, ledger_path, dry_run)
    except Exception as e:
        return TransactionSubmitResponse(
            success=False, message=f"Failed to process receipt: {str(e)}"
        )
