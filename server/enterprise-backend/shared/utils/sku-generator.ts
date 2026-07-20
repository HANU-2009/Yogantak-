import { v4 as uuidv4 } from 'uuid';
import slugify from 'slugify';

/**
 * Generate a unique SKU: PREFIX-RANDOM8
 * e.g. PROD-A1B2C3D4
 */
export function generateSKU(prefix = 'PROD'): string {
  const random = uuidv4().replace(/-/g, '').toUpperCase().slice(0, 8);
  return `${prefix.toUpperCase()}-${random}`;
}

/**
 * Generate a unique product slug
 */
export function generateSlug(name: string, suffix?: string): string {
  const base = slugify(name, { lower: true, strict: true, trim: true });
  const uniqueSuffix = suffix || Math.random().toString(36).slice(2, 7);
  return `${base}-${uniqueSuffix}`;
}

/**
 * Generate a barcode (EAN-13 compatible numeric string)
 */
export function generateBarcodeValue(): string {
  const prefix = '890'; // India country code prefix
  const middle = Math.floor(Math.random() * 1_000_000_000).toString().padStart(9, '0');
  const raw = prefix + middle;
  const checkDigit = calculateEAN13CheckDigit(raw);
  return raw + checkDigit;
}

function calculateEAN13CheckDigit(code: string): string {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (sum % 10)) % 10;
  return check.toString();
}

/**
 * Generate a purchase order number
 */
export function generatePONumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `PO-${year}${month}-${random}`;
}

/**
 * Generate a sales order number
 */
export function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `SO-${year}${month}-${random}`;
}

/**
 * Generate a transfer number
 */
export function generateTransferNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `TRF-${year}${month}-${random}`;
}

/**
 * Generate a return number
 */
export function generateReturnNumber(prefix = 'RET'): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${year}${month}-${random}`;
}

/**
 * Generate a supplier code
 */
export function generateSupplierCode(): string {
  return 'SUP-' + uuidv4().replace(/-/g, '').toUpperCase().slice(0, 6);
}

/**
 * Generate a warehouse code
 */
export function generateWarehouseCode(): string {
  return 'WH-' + uuidv4().replace(/-/g, '').toUpperCase().slice(0, 4);
}

/**
 * Generate an invoice number
 */
export function generateInvoiceNumber(prefix = 'INV'): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `${prefix}-${year}${month}-${random}`;
}
