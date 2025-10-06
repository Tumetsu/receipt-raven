"""
Service for extracting categories from beancount ledger
Categories are derived from expense accounts
"""
from typing import List
from beancount import loader
from beancount.core import getters
from models import Category


def get_categories(ledger_path: str) -> List[Category]:
    """
    Get expense categories from the beancount ledger
    Categories are extracted from Expenses accounts

    Args:
        ledger_path: Path to the beancount ledger file

    Returns:
        List of Category objects
    """
    entries, errors, options = loader.load_file(ledger_path)

    if errors:
        print(f"Beancount loader errors: {errors}")

    # Get all account names
    all_accounts = getters.get_accounts(entries)

    # Extract expense accounts
    expense_accounts = [acc for acc in all_accounts if acc.startswith("Expenses:")]

    categories = []
    seen_categories = set()

    for account in sorted(expense_accounts):
        # Split the account to get categories
        # Example: Expenses:Food:Groceries -> Food, Groceries
        parts = account.split(":")[1:]  # Skip "Expenses"

        # Create category from the immediate subcategory
        if parts:
            category_name = parts[0]  # First level: Food

            if category_name not in seen_categories:
                seen_categories.add(category_name)
                categories.append(
                    Category(
                        name=category_name,
                        account_mapping=f"Expenses:{category_name}",
                    )
                )

    return categories
