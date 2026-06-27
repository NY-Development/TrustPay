import { z } from 'zod';

export const verifyManualSchema = {
  body: z.object({
    reference: z.string().min(1, 'Reference is required'),
    amountExpected:  z.number().optional(),
    branchId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Branch ID').optional(),
  }),
};

export const verifyUniversalSchema = {
  body: z.object({
    reference: z.string().min(1, 'Reference is required'),
    suffix: z.string().optional(),
    phoneNumber: z.string().optional(),
    amountExpected: z.number().optional(),
    branchId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Branch ID').optional(),
  }),
};

export const verifyOcrSchema = {
  body: z.object({
    rawText: z.string().min(1, 'OCR text is required'),
    branchId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Branch ID').optional(),
    amountExpected: z.number().optional(),
  }),
};
