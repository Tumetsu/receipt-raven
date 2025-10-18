"""
Beancount Ledger Service
FastAPI application that provides REST API access to beancount ledger
"""
import os
from typing import Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from models import (
    AccountsResponse,
    PayeesResponse,
    Transaction,
    ReceiptTransactionData,
    TransactionSubmitResponse,
)
from services.accounts import get_accounts
from services.payees import get_payees
from services.transactions import (
    submit_transaction,
    submit_receipt_transaction,
)

# Load environment variables
load_dotenv()

# Configuration
BEANCOUNT_LEDGER_PATH = os.getenv("BEANCOUNT_LEDGER_PATH")
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "").split(",")

if not BEANCOUNT_LEDGER_PATH:
    raise ValueError("BEANCOUNT_LEDGER_PATH environment variable must be set")

# Create FastAPI app
app = FastAPI(
    title="Beancount Ledger Service",
    description="REST API for beancount ledger operations",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if ALLOWED_ORIGINS[0] else ["*"],
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
    if not os.path.exists(BEANCOUNT_LEDGER_PATH):
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
        accounts = get_accounts(BEANCOUNT_LEDGER_PATH, type)
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
        payees = get_payees(BEANCOUNT_LEDGER_PATH)
        return PayeesResponse(payees=payees)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch payees: {e}")


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
        result = submit_transaction(transaction, BEANCOUNT_LEDGER_PATH, dry_run)
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
            receipt_data, BEANCOUNT_LEDGER_PATH, dry_run
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to submit receipt transaction: {e}"
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=HOST, port=PORT)
