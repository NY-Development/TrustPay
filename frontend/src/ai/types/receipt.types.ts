/**
 * Receipt Zod Schemas
 *
 * Validates and types all AI-generated receipt data.
 * Used by receipt-parser.ts to guarantee type safety.
 */
import { z } from 'zod';

// ─── Receipt Item ────────────────────────────────────────────────

export const ReceiptItemSchema = z.object({
  description: z.string().default('Unknown Item'),
  quantity: z.number().nullable().default(null),
  unitPrice: z.number().nullable().default(null),
  totalPrice: z.number().nullable().default(null),
});

export type ValidatedReceiptItem = z.infer<typeof ReceiptItemSchema>;

// ─── Expense Category ────────────────────────────────────────────

export const ExpenseCategorySchema = z.enum([
  'meals', 'travel', 'lodging', 'supplies', 'software',
  'services', 'hardware', 'groceries', 'transportation',
  'utilities', 'entertainment', 'healthcare', 'education',
  'shopping', 'business', 'rent_housing', 'subscriptions',
  'personal_care', 'donations', 'taxes_fees', 'other',
]);

export type ValidatedExpenseCategory = z.infer<typeof ExpenseCategorySchema>;

// ─── Receipt Data ────────────────────────────────────────────────

export const ReceiptDataSchema = z.object({
  merchant: z.string().nullable().default(null),
  date: z.string().nullable().default(null),
  subtotal: z.number().nullable().default(null),
  tax: z.number().nullable().default(null),
  vat: z.number().nullable().default(null),
  total: z.number().nullable().default(null),
  currency: z.string().default('ETB'),
  paymentMethod: z.string().nullable().default(null),
  items: z.array(ReceiptItemSchema).default([]),
  category: ExpenseCategorySchema.default('other'),
  confidence: z.number().min(0).max(1).default(0.5),
  referenceNumber: z.string().nullable().default(null),
  transactionNumber: z.string().nullable().default(null),
  bank: z.string().default('unknown'),
  senderName: z.string().nullable().default(null),
  receiverName: z.string().nullable().default(null),
});

export type ValidatedReceiptData = z.infer<typeof ReceiptDataSchema>;
