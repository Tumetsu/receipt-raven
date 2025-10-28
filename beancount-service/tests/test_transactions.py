"""
Unit tests for transaction service
"""
import os
import tempfile
import pytest
from datetime import datetime
from decimal import Decimal
from beancount.core import data, amount

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from models import Transaction, TransactionPosting, ReceiptTransactionData, ReceiptTransactionItem
from services.transactions import (
    create_beancount_transaction,
    validate_transaction,
    validate_accounts_exist,
    create_receipt_transaction,
    submit_transaction,
    submit_receipt_transaction,
)


# Fixtures

@pytest.fixture
def test_ledger_path():
    """Path to test ledger file"""
    return os.path.join(os.path.dirname(__file__), "test_ledger.beancount")


@pytest.fixture
def temp_ledger_path(test_ledger_path):
    """Create a temporary copy of the test ledger for write tests"""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.beancount', delete=False) as f:
        with open(test_ledger_path, 'r') as source:
            f.write(source.read())
        temp_path = f.name

    yield temp_path

    # Cleanup
    if os.path.exists(temp_path):
        os.remove(temp_path)


@pytest.fixture
def valid_transaction():
    """A valid balanced transaction"""
    return Transaction(
        date="2024-01-20",
        payee="Test Shop",
        narration="Test purchase",
        postings=[
            TransactionPosting(
                account="Expenses:Groceries",
                amount=25.50,
                currency="EUR",
            ),
            TransactionPosting(
                account="Assets:Checking",
                amount=-25.50,
                currency="EUR",
            ),
        ],
    )


@pytest.fixture
def unbalanced_transaction():
    """An unbalanced transaction that should fail validation"""
    return Transaction(
        date="2024-01-20",
        payee="Test Shop",
        narration="Unbalanced transaction",
        postings=[
            TransactionPosting(
                account="Expenses:Groceries",
                amount=25.50,
                currency="EUR",
            ),
            TransactionPosting(
                account="Assets:Checking",
                amount=-20.00,  # Doesn't balance!
                currency="EUR",
            ),
        ],
    )


@pytest.fixture
def invalid_account_transaction():
    """A transaction with a non-existent account"""
    return Transaction(
        date="2024-01-20",
        payee="Test Shop",
        narration="Invalid account",
        postings=[
            TransactionPosting(
                account="Expenses:NonExistent",  # This account doesn't exist
                amount=25.50,
                currency="EUR",
            ),
            TransactionPosting(
                account="Assets:Checking",
                amount=-25.50,
                currency="EUR",
            ),
        ],
    )


@pytest.fixture
def valid_receipt_data():
    """Valid receipt transaction data"""
    return ReceiptTransactionData(
        receipt_id=1,
        payee="Test Grocery Store",
        date="2024-01-20",
        items=[
            ReceiptTransactionItem(
                name="Apples",
                price=5.00,
                expense_account="Expenses:Groceries",
            ),
            ReceiptTransactionItem(
                name="Bread",
                price=3.50,
                expense_account="Expenses:Groceries",
            ),
        ],
        total=8.50,
        source_account="Assets:Checking",
        currency="EUR",
    )


# Tests for create_beancount_transaction

def test_create_beancount_transaction_basic(valid_transaction):
    """Test creating a basic beancount transaction"""
    bean_txn = create_beancount_transaction(valid_transaction)

    assert isinstance(bean_txn, data.Transaction)
    assert bean_txn.payee == "Test Shop"
    assert bean_txn.narration == "Test purchase"
    assert bean_txn.date == datetime(2024, 1, 20).date()
    assert bean_txn.flag == "*"
    assert len(bean_txn.postings) == 2


def test_create_beancount_transaction_with_tags():
    """Test creating a transaction with tags"""
    txn = Transaction(
        date="2024-01-20",
        payee="Test Shop",
        narration="Test purchase",
        postings=[
            TransactionPosting(account="Expenses:Groceries", amount=10.00, currency="EUR"),
            TransactionPosting(account="Assets:Checking", amount=-10.00, currency="EUR"),
        ],
        tags=["groceries", "weekly"],
    )

    bean_txn = create_beancount_transaction(txn)

    assert "groceries" in bean_txn.tags
    assert "weekly" in bean_txn.tags


def test_create_beancount_transaction_with_links():
    """Test creating a transaction with links"""
    txn = Transaction(
        date="2024-01-20",
        payee="Test Shop",
        narration="Test purchase",
        postings=[
            TransactionPosting(account="Expenses:Groceries", amount=10.00, currency="EUR"),
            TransactionPosting(account="Assets:Checking", amount=-10.00, currency="EUR"),
        ],
        links=["invoice-123"],
    )

    bean_txn = create_beancount_transaction(txn)

    assert "invoice-123" in bean_txn.links


def test_create_beancount_transaction_with_metadata():
    """Test creating a transaction with metadata"""
    txn = Transaction(
        date="2024-01-20",
        payee="Test Shop",
        narration="Test purchase",
        postings=[
            TransactionPosting(account="Expenses:Groceries", amount=10.00, currency="EUR"),
            TransactionPosting(account="Assets:Checking", amount=-10.00, currency="EUR"),
        ],
        metadata={"receipt_id": "1", "payment_method": "card"},
    )

    bean_txn = create_beancount_transaction(txn)

    assert bean_txn.meta.get("receipt_id") == "1"
    assert bean_txn.meta.get("payment_method") == "card"


def test_create_beancount_transaction_posting_amounts(valid_transaction):
    """Test that posting amounts are correctly converted"""
    bean_txn = create_beancount_transaction(valid_transaction)

    assert bean_txn.postings[0].units.number == Decimal("25.50")
    assert bean_txn.postings[0].units.currency == "EUR"
    assert bean_txn.postings[1].units.number == Decimal("-25.50")
    assert bean_txn.postings[1].units.currency == "EUR"


def test_create_beancount_transaction_posting_comment():
    """Test that posting comments are preserved"""
    txn = Transaction(
        date="2024-01-20",
        payee="Test Shop",
        narration="Test purchase",
        postings=[
            TransactionPosting(
                account="Expenses:Groceries",
                amount=10.00,
                currency="EUR",
                comment="Weekly shopping",
            ),
            TransactionPosting(account="Assets:Checking", amount=-10.00, currency="EUR"),
        ],
    )

    bean_txn = create_beancount_transaction(txn)

    assert bean_txn.postings[0].meta is not None
    assert bean_txn.postings[0].meta.get("comment") == "Weekly shopping"


# Tests for validate_transaction

def test_validate_transaction_balanced(valid_transaction):
    """Test that a balanced transaction passes validation"""
    bean_txn = create_beancount_transaction(valid_transaction)
    is_valid, error_message = validate_transaction(bean_txn)

    assert is_valid is True
    assert error_message is None


def test_validate_transaction_unbalanced(unbalanced_transaction):
    """Test that an unbalanced transaction fails validation"""
    bean_txn = create_beancount_transaction(unbalanced_transaction)
    is_valid, error_message = validate_transaction(bean_txn)

    assert is_valid is False
    assert error_message is not None
    assert "does not balance" in error_message
    assert "EUR" in error_message


def test_validate_transaction_multiple_currencies():
    """Test validation with multiple currencies"""
    txn = Transaction(
        date="2024-01-20",
        payee="Test Shop",
        narration="Multi-currency transaction",
        postings=[
            TransactionPosting(account="Expenses:Groceries", amount=10.00, currency="EUR"),
            TransactionPosting(account="Assets:Checking", amount=-10.00, currency="EUR"),
            TransactionPosting(account="Expenses:Travel", amount=5.00, currency="USD"),
            TransactionPosting(account="Assets:USDAccount", amount=-5.00, currency="USD"),
        ],
    )

    bean_txn = create_beancount_transaction(txn)
    is_valid, error_message = validate_transaction(bean_txn)

    assert is_valid is True
    assert error_message is None


def test_validate_transaction_multiple_currencies_unbalanced():
    """Test validation with unbalanced multi-currency transaction"""
    txn = Transaction(
        date="2024-01-20",
        payee="Test Shop",
        narration="Multi-currency transaction",
        postings=[
            TransactionPosting(account="Expenses:Groceries", amount=10.00, currency="EUR"),
            TransactionPosting(account="Assets:Checking", amount=-10.00, currency="EUR"),
            TransactionPosting(account="Expenses:Travel", amount=5.00, currency="USD"),
            TransactionPosting(account="Assets:USDAccount", amount=-3.00, currency="USD"),  # Unbalanced
        ],
    )

    bean_txn = create_beancount_transaction(txn)
    is_valid, error_message = validate_transaction(bean_txn)

    assert is_valid is False
    assert "USD" in error_message


def test_validate_transaction_with_rounding():
    """Test that small rounding errors are tolerated"""
    txn = Transaction(
        date="2024-01-20",
        payee="Test Shop",
        narration="Transaction with rounding",
        postings=[
            TransactionPosting(account="Expenses:Groceries", amount=10.003, currency="EUR"),
            TransactionPosting(account="Assets:Checking", amount=-10.002, currency="EUR"),
        ],
    )

    bean_txn = create_beancount_transaction(txn)
    is_valid, error_message = validate_transaction(bean_txn)

    # Should pass due to tolerance of 0.005
    assert is_valid is True


# Tests for validate_accounts_exist

def test_validate_accounts_exist_valid(valid_transaction, test_ledger_path):
    """Test that validation passes for existing accounts"""
    bean_txn = create_beancount_transaction(valid_transaction)
    is_valid, error_message = validate_accounts_exist(bean_txn, test_ledger_path)

    assert is_valid is True
    assert error_message is None


def test_validate_accounts_exist_invalid(invalid_account_transaction, test_ledger_path):
    """Test that validation fails for non-existent accounts"""
    bean_txn = create_beancount_transaction(invalid_account_transaction)
    is_valid, error_message = validate_accounts_exist(bean_txn, test_ledger_path)

    assert is_valid is False
    assert error_message is not None
    assert "Expenses:NonExistent" in error_message
    assert "do not exist" in error_message


def test_validate_accounts_exist_multiple_invalid(test_ledger_path):
    """Test validation with multiple invalid accounts"""
    txn = Transaction(
        date="2024-01-20",
        payee="Test Shop",
        narration="Multiple invalid accounts",
        postings=[
            TransactionPosting(account="Expenses:Fake1", amount=10.00, currency="EUR"),
            TransactionPosting(account="Expenses:Fake2", amount=5.00, currency="EUR"),
            TransactionPosting(account="Assets:Checking", amount=-15.00, currency="EUR"),
        ],
    )

    bean_txn = create_beancount_transaction(txn)
    is_valid, error_message = validate_accounts_exist(bean_txn, test_ledger_path)

    assert is_valid is False
    assert "Expenses:Fake1" in error_message
    assert "Expenses:Fake2" in error_message


# Tests for create_receipt_transaction

def test_create_receipt_transaction_basic(valid_receipt_data):
    """Test creating a transaction from receipt data"""
    txn = create_receipt_transaction(valid_receipt_data)

    assert isinstance(txn, Transaction)
    assert txn.payee == "Test Grocery Store"
    assert txn.narration == "#1 Receipt"
    assert txn.date == "2024-01-20"
    assert "receipt-raven" in txn.tags
    assert txn.metadata.get("receipt_id") == "1"


def test_create_receipt_transaction_postings(valid_receipt_data):
    """Test that receipt items are converted to postings correctly"""
    txn = create_receipt_transaction(valid_receipt_data)

    # Should have 3 postings: 2 items + 1 source account
    assert len(txn.postings) == 3

    # Check expense postings
    expense_postings = [p for p in txn.postings if p.account.startswith("Expenses")]
    assert len(expense_postings) == 2
    assert sum(p.amount for p in expense_postings) == 8.50

    # Check source account posting
    source_postings = [p for p in txn.postings if p.account == "Assets:Checking"]
    assert len(source_postings) == 1
    assert source_postings[0].amount == -8.50


def test_create_receipt_transaction_item_comments(valid_receipt_data):
    """Test that item names are added as comments to postings"""
    txn = create_receipt_transaction(valid_receipt_data)

    expense_postings = [p for p in txn.postings if p.account.startswith("Expenses")]

    comments = [p.comment for p in expense_postings if p.comment]
    assert "Apples" in comments
    assert "Bread" in comments

# Tests for submit_transaction

def test_submit_transaction_valid(valid_transaction, temp_ledger_path):
    """Test submitting a valid transaction"""
    result = submit_transaction(valid_transaction, temp_ledger_path, dry_run=False)

    assert result.success is True
    assert result.transaction_id is not None
    assert "2024-01-20" in result.transaction_id

    # Verify transaction was written to file
    with open(temp_ledger_path, 'r') as f:
        content = f.read()
        assert "Test Shop" in content
        assert "Test purchase" in content


def test_submit_transaction_dry_run(valid_transaction, temp_ledger_path):
    """Test dry run doesn't write to file"""
    # Read initial file size
    initial_content = open(temp_ledger_path, 'r').read()

    result = submit_transaction(valid_transaction, temp_ledger_path, dry_run=True)

    assert result.success is True
    assert "validated" in result.message.lower()
    assert result.transaction_id is None

    # Verify file wasn't modified
    final_content = open(temp_ledger_path, 'r').read()
    assert initial_content == final_content


def test_submit_transaction_unbalanced(unbalanced_transaction, temp_ledger_path):
    """Test that unbalanced transactions are rejected"""
    result = submit_transaction(unbalanced_transaction, temp_ledger_path, dry_run=False)

    assert result.success is False
    assert "validation failed" in result.message.lower()
    assert "does not balance" in result.message


def test_submit_transaction_invalid_account(invalid_account_transaction, temp_ledger_path):
    """Test that transactions with invalid accounts are rejected"""
    result = submit_transaction(invalid_account_transaction, temp_ledger_path, dry_run=False)

    assert result.success is False
    assert "account validation failed" in result.message.lower()
    assert "NonExistent" in result.message


def test_submit_transaction_preserves_existing_content(valid_transaction, temp_ledger_path):
    """Test that submitting a transaction preserves existing ledger content"""
    # Read initial content
    with open(temp_ledger_path, 'r') as f:
        initial_content = f.read()

    result = submit_transaction(valid_transaction, temp_ledger_path, dry_run=False)
    assert result.success is True

    # Read final content
    with open(temp_ledger_path, 'r') as f:
        final_content = f.read()

    # Initial content should still be there
    assert initial_content in final_content
    # New content should be added
    assert len(final_content) > len(initial_content)


# Tests for submit_receipt_transaction

def test_submit_receipt_transaction_valid(valid_receipt_data, temp_ledger_path):
    """Test submitting a valid receipt transaction"""
    result = submit_receipt_transaction(valid_receipt_data, temp_ledger_path, dry_run=False)

    assert result.success is True
    assert result.transaction_id is not None

    # Verify receipt data was written
    with open(temp_ledger_path, 'r') as f:
        content = f.read()
        assert "Test Grocery Store" in content


def test_submit_receipt_transaction_dry_run(valid_receipt_data, temp_ledger_path):
    """Test receipt transaction dry run"""
    initial_content = open(temp_ledger_path, 'r').read()

    result = submit_receipt_transaction(valid_receipt_data, temp_ledger_path, dry_run=True)

    assert result.success is True
    assert result.transaction_id is None

    # File should not be modified
    final_content = open(temp_ledger_path, 'r').read()
    assert initial_content == final_content


def test_submit_receipt_transaction_invalid_account(test_ledger_path):
    """Test that receipt with invalid account is rejected"""
    receipt_data = ReceiptTransactionData(
        receipt_id=1,
        payee="Test Shop",
        date="2024-01-20",
        items=[
            ReceiptTransactionItem(
                name="Item",
                price=10.00,
                expense_account="Expenses:InvalidCategory",
            ),
        ],
        total=10.00,
        source_account="Assets:Checking",
    )

    result = submit_receipt_transaction(receipt_data, test_ledger_path, dry_run=False)

    assert result.success is False
    assert "account validation failed" in result.message.lower()


def test_submit_receipt_transaction_balances(valid_receipt_data):
    """Test that receipt transaction balances correctly"""
    txn = create_receipt_transaction(valid_receipt_data)
    bean_txn = create_beancount_transaction(txn)

    is_valid, error = validate_transaction(bean_txn)
    assert is_valid is True
    assert error is None
