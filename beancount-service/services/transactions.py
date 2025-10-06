"""
Service for creating and submitting transactions to beancount ledger
"""
from typing import Optional
from datetime import datetime
from decimal import Decimal
from beancount.core import data, amount
from beancount.parser import printer
from models import Transaction, ReceiptTransactionData, TransactionSubmitResponse


def format_transaction_entry(txn: Transaction) -> str:
    """
    Format a transaction into beancount syntax

    Args:
        txn: Transaction model

    Returns:
        Formatted beancount transaction string
    """
    lines = []

    # Date and header
    date_str = txn.date
    tags_str = " ".join([f"#{tag}" for tag in txn.tags]) if txn.tags else ""
    links_str = " ".join([f"^{link}" for link in txn.links]) if txn.links else ""

    header = f'{date_str} * "{txn.payee}" "{txn.narration}"'
    if tags_str:
        header += f" {tags_str}"
    if links_str:
        header += f" {links_str}"

    lines.append(header)

    # Metadata
    if txn.metadata:
        for key, value in txn.metadata.items():
            lines.append(f"  {key}: {value}")

    # Postings
    for posting in txn.postings:
        currency = posting.currency or "EUR"
        posting_line = f"  {posting.account:<50} {posting.amount:>12.2f} {currency}"
        if posting.comment:
            posting_line += f"  ; {posting.comment}"
        lines.append(posting_line)

    return "\n".join(lines)


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
            expense_account = f"Expenses:{item.category}"

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
        payee=receipt_data.shop,
        narration=f"Receipt #{receipt_data.receipt_id}",
        postings=postings,
        tags=["receipt"],
        metadata={"receipt_id": receipt_data.receipt_id},
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
        # Format the transaction
        formatted_txn = format_transaction_entry(transaction)

        if dry_run:
            # Just return the formatted transaction for validation
            return TransactionSubmitResponse(
                success=True,
                message="Dry run - transaction validated",
                transaction_id=None,
            )

        # Append to ledger file
        with open(ledger_path, "a", encoding="utf-8") as f:
            f.write("\n\n")
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
