"""
Beancount Ledger Service
FastAPI application that provides REST API access to beancount ledger
"""
import os
from typing import Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from models import (
    AccountsResponse,
    PayeesResponse,
    Transaction,
    ReceiptTransactionData,
    TransactionSubmitResponse,
    MonthlyExpensesResponse,
)
from services.accounts import get_accounts
from services.payees import get_payees
from services.transactions import (
    submit_transaction,
    submit_receipt_transaction,
)
from services.monthly_expenses import get_current_month_expenses

# Load settings (validates configuration on startup)
settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title="Beancount Ledger Service",
    description="REST API for beancount ledger operations",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins if settings.allowed_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    # Check if ledger file exists
    if not os.path.exists(settings.beancount_ledger_path):
        raise HTTPException(status_code=503, detail="Ledger file not found")

    return {"status": "ok"}


@app.get("/accounts", response_model=AccountsResponse)
async def get_accounts_endpoint(
    type: Optional[str] = Query(None, description="Filter by account type")
):
    """
    Get all accounts from the ledger

    Args:
        type: Optional filter by account type (e.g., "Expenses", "Assets")

    Returns:
        List of accounts
    """
    try:
        accounts = get_accounts(settings.beancount_ledger_path, type)
        return AccountsResponse(accounts=accounts)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch accounts: {e}")


@app.get("/payees", response_model=PayeesResponse)
async def get_payees_endpoint():
    """
    Get list of payees (shops, vendors) from the ledger

    Returns:
        List of payees
    """
    try:
        payees = get_payees(settings.beancount_ledger_path)
        return PayeesResponse(payees=payees)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch payees: {e}")


@app.get("/monthly-expenses", response_model=MonthlyExpensesResponse)
async def get_monthly_expenses_endpoint():
    """
    Get total expenses for the current month

    Returns:
        Total expenses by currency for the ongoing month
    """
    try:
        from datetime import datetime
        now = datetime.now()
        expenses = get_current_month_expenses(settings.beancount_ledger_path)
        return MonthlyExpensesResponse(
            expenses_by_currency=expenses,
            year=now.year,
            month=now.month
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch monthly expenses: {e}")


@app.post("/transactions", response_model=TransactionSubmitResponse)
async def submit_transaction_endpoint(
    transaction: Transaction, dry_run: bool = Query(False)
):
    """
    Submit a transaction to the ledger

    Args:
        transaction: Transaction data
        dry_run: If True, only validate without writing to ledger

    Returns:
        Success status and transaction ID
    """
    try:
        result = submit_transaction(transaction, settings.beancount_ledger_path, dry_run)
        if not result.success:
            raise HTTPException(status_code=400, detail=result.message)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to submit transaction: {e}"
        )


@app.post("/transactions/receipt", response_model=TransactionSubmitResponse)
async def submit_receipt_transaction_endpoint(
    receipt_data: ReceiptTransactionData, dry_run: bool = Query(False)
):
    """
    Convert receipt data to transaction and submit to ledger

    Args:
        receipt_data: Receipt transaction data
        dry_run: If True, only validate without writing to ledger

    Returns:
        Success status and transaction ID
    """
    try:
        result = submit_receipt_transaction(
            receipt_data, settings.beancount_ledger_path, dry_run
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to submit receipt transaction: {e}"
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=settings.host, port=settings.port)
