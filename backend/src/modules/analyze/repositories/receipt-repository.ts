import Database from 'better-sqlite3';
import { config } from '../../../config/index.js';
import { ReceiptAnalysisResult } from '../../../types/shared.js';

export interface ReceiptRecord {
  id: number;
  objectKey: string;
  filepath: string;
  shop: string;
  receiptDate: string;
  totalSum: number;
  parsedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReceiptItemRecord {
  id: number;
  receiptId: number;
  name: string;
  category: string;
  price: number;
  parsedBy?: string;
  createdAt: string;
}

/**
 * Repository for receipt data access operations
 */
export interface IReceiptRepository {
  /**
   * Initialize database schema
   */
  initialize(): void;

  /**
   * Save receipt analysis result
   * @param objectKey File identifier (filename or object key)
   * @param filepath Full path to the receipt image file
   * @param analysis Receipt analysis result
   * @param parsedBy Model identifier that parsed this receipt
   * @returns The saved receipt record
   */
  saveReceipt(
    objectKey: string,
    filepath: string,
    analysis: ReceiptAnalysisResult,
    parsedBy?: string
  ): ReceiptRecord;

  /**
   * Close database connection
   */
  close(): void;
}

/**
 * SQLite implementation of receipt repository
 */
export class SQLiteReceiptRepository implements IReceiptRepository {
  private db: Database.Database | null = null;
  private dbPath: string;

  constructor(dbPath: string = config.database.path) {
    this.dbPath = dbPath;
  }

  initialize(): void {
    // Create database connection when initializing
    this.db = new Database(this.dbPath);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS receipts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        objectKey TEXT NOT NULL,
        filepath TEXT NOT NULL,
        shop TEXT NOT NULL,
        receiptDate DATE NOT NULL,
        totalSum DECIMAL(10,2) NOT NULL,
        parsedBy TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS receipt_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        receiptId INTEGER NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        parsedBy TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (receiptId) REFERENCES receipts(id)
      );
    `);
  }

  saveReceipt(
    objectKey: string,
    filepath: string,
    analysis: ReceiptAnalysisResult,
    parsedBy?: string
  ): ReceiptRecord {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    const db = this.db; // Capture for use in transaction closure

    const transaction = db.transaction(
      (
        objectKey: string,
        filepath: string,
        analysis: ReceiptAnalysisResult
      ) => {
        // Insert receipt
        const receiptStmt = db.prepare(`
        INSERT INTO receipts (objectKey, filepath, shop, receiptDate, totalSum, parsedBy)
        VALUES (@objectKey, @filepath, @shop, @receiptDate, @totalSum, @parsedBy)
      `);

        const insertResult = receiptStmt.run({
          objectKey,
          filepath,
          shop: analysis.shop,
          receiptDate: analysis.date,
          parsedBy: parsedBy || null,
          totalSum: analysis.total,
        });

        console.log('Receipt insert result:', insertResult);
        console.log('Last insert rowid:', insertResult.lastInsertRowid);

        // Fetch the inserted receipt
        const receipt = db
          .prepare(`SELECT * FROM receipts WHERE id = ?`)
          .get(insertResult.lastInsertRowid) as ReceiptRecord;

        console.log('Fetched receipt:', receipt);

        // Insert receipt items
        const itemStmt = db.prepare(`
        INSERT INTO receipt_items (receiptId, name, category, price, parsedBy)
        VALUES (@receiptId, @name, @category, @price, @parsedBy)
      `);

        for (const product of analysis.products) {
          itemStmt.run({
            receiptId: receipt.id,
            name: product.name,
            category: product.category,
            price: product.price,
            parsedBy: parsedBy || null,
          });
        }

        return receipt;
      }
    );

    return transaction(objectKey, filepath, analysis);
  }

  close(): void {
    if (this.db) {
      this.db.close();
    }
  }
}

// Export singleton instance for the analyze module
export const receiptRepository = new SQLiteReceiptRepository();
