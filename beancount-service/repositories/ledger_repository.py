"""
Ledger repository abstraction for accessing beancount ledger data
"""
import os
from abc import ABC, abstractmethod
from typing import Tuple, List, Dict, Any, Optional
from datetime import datetime, timedelta

from beancount import loader
from utils.logging import get_logger


logger = get_logger(__name__)


class ILedgerRepository(ABC):
    """
    Abstract interface for ledger repository.

    This interface defines the contract for accessing ledger data,
    allowing for different implementations (file-based, database, etc.)
    """

    @abstractmethod
    def load_entries(self) -> Tuple[List, List, Dict]:
        """
        Load ledger entries from the data source.

        Returns:
            Tuple of (entries, errors, options)
        """
        pass

    @abstractmethod
    def append_transaction(self, transaction_text: str) -> None:
        """
        Append a formatted transaction to the ledger.

        Args:
            transaction_text: Formatted transaction text to append

        Raises:
            IOError: If writing to ledger fails
        """
        pass

    @abstractmethod
    def ledger_exists(self) -> bool:
        """
        Check if the ledger file/data source exists.

        Returns:
            True if ledger exists, False otherwise
        """
        pass


class BeancountFileRepository(ILedgerRepository):
    """
    File-based implementation of the ledger repository.

    Provides caching of loaded entries to improve performance.
    """

    def __init__(self, ledger_path: str, cache_ttl_seconds: int = 60):
        """
        Initialize the repository.

        Args:
            ledger_path: Path to the beancount ledger file
            cache_ttl_seconds: Time-to-live for cached entries in seconds (default: 60)
        """
        self._ledger_path = ledger_path
        self._cache_ttl = timedelta(seconds=cache_ttl_seconds)
        self._cached_entries: Optional[Tuple[List, List, Dict]] = None
        self._cache_timestamp: Optional[datetime] = None
        logger.debug("ledger_repository_initialized", ledger_path=ledger_path, cache_ttl=cache_ttl_seconds)

    def load_entries(self) -> Tuple[List, List, Dict]:
        """
        Load ledger entries from file with caching.

        Returns:
            Tuple of (entries, errors, options)
        """
        # Check if we have a valid cache
        if self._is_cache_valid():
            logger.debug("using_cached_entries", ledger_path=self._ledger_path)
            return self._cached_entries

        # Load from file
        logger.debug("loading_ledger_from_file", ledger_path=self._ledger_path)
        try:
            entries, errors, options = loader.load_file(self._ledger_path)

            if errors:
                logger.warning(
                    "ledger_load_errors",
                    ledger_path=self._ledger_path,
                    error_count=len(errors),
                    errors=str(errors)[:500]
                )

            # Cache the result
            self._cached_entries = (entries, errors, options)
            self._cache_timestamp = datetime.now()

            logger.info(
                "ledger_loaded",
                ledger_path=self._ledger_path,
                entry_count=len(entries),
                error_count=len(errors)
            )

            return entries, errors, options

        except Exception as e:
            logger.error("failed_to_load_ledger", ledger_path=self._ledger_path, error=str(e))
            raise

    def append_transaction(self, transaction_text: str) -> None:
        """
        Append a formatted transaction to the ledger file.

        Args:
            transaction_text: Formatted transaction text to append

        Raises:
            IOError: If writing to ledger fails
        """
        try:
            logger.debug("appending_transaction_to_ledger", ledger_path=self._ledger_path)

            with open(self._ledger_path, "a", encoding="utf-8") as f:
                f.write("\n")
                f.write(transaction_text)
                f.write("\n")

            # Invalidate cache after write
            self._invalidate_cache()

            logger.info("transaction_appended_to_ledger", ledger_path=self._ledger_path)

        except Exception as e:
            logger.error("failed_to_append_transaction", ledger_path=self._ledger_path, error=str(e))
            raise IOError(f"Failed to write transaction to ledger: {e}") from e

    def ledger_exists(self) -> bool:
        """
        Check if the ledger file exists.

        Returns:
            True if ledger file exists, False otherwise
        """
        exists = os.path.exists(self._ledger_path)
        logger.debug("ledger_exists_check", ledger_path=self._ledger_path, exists=exists)
        return exists

    def _is_cache_valid(self) -> bool:
        """Check if the cached entries are still valid."""
        if self._cached_entries is None or self._cache_timestamp is None:
            return False

        age = datetime.now() - self._cache_timestamp
        is_valid = age < self._cache_ttl

        if not is_valid:
            logger.debug("cache_expired", age_seconds=age.total_seconds(), ttl_seconds=self._cache_ttl.total_seconds())

        return is_valid

    def _invalidate_cache(self) -> None:
        """Invalidate the cache."""
        logger.debug("invalidating_cache", ledger_path=self._ledger_path)
        self._cached_entries = None
        self._cache_timestamp = None
