import { z } from 'zod';

export const sendMessageSchema = {
  body: z.object({
    recipientType: z.enum(['INDIVIDUAL', 'BRANCH', 'COMPANY'], {
      errorMap: () => ({ message: 'Invalid recipient type' }),
    }),
    messageType: z.enum(['ANNOUNCEMENT', 'TASK', 'REMINDER', 'ALERT'], {
      errorMap: () => ({ message: 'Invalid message type' }),
    }),
    title: z.string().min(1, 'Message title is required'),
    body: z.string().min(1, 'Message body is required'),
    branchId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Branch ID format').optional(),
    recipientIds: z.array(
      z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Employee ID format')
    ).optional(),
  }),
};
