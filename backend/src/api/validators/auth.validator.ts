import { z } from 'zod';
import { ALL_PROVIDERS, COMPANY_TYPES } from '../../constants';

export const registerSchema = {
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    
    companyInfo: z.object({
      companyName: z.string().min(1, 'Company Name is required'),
      companyType: z.enum(Object.values(COMPANY_TYPES) as [string, ...string[]], {
        errorMap: () => ({ message: 'Invalid company type' }),
      }),
      website: z.string().url('Invalid website URL').optional().or(z.literal('')),
      country: z.string().min(1, 'Country is required'),
      region: z.string().min(1, 'Region is required'),
      city: z.string().min(1, 'City is required'),
      address: z.string().min(1, 'Address is required'),
    }),

    initialBranch: z.object({
      branchName: z.string().min(1, 'Initial branch name is required'),
      country: z.string().min(1, 'Branch country is required').default('Ethiopia'),
      region: z.string().min(1, 'Branch region is required'),
      city: z.string().min(1, 'Branch city is required'),
      subCity: z.string().optional(),
      wereda: z.string().optional(),
      kebele: z.string().optional(),
      address: z.string().min(1, 'Branch detailed address is required'),
      phone: z.string().min(1, 'Branch contact phone is required'),
      email: z.string().email('Invalid branch contact email'),
      accounts: z.array(
        z.object({
          accountNumber: z.string().min(1, 'Account number is required'),
          accountProvider: z.enum(ALL_PROVIDERS as [string, ...string[]], {
            errorMap: () => ({ message: 'Invalid account provider' }),
          }),
        })
      ).min(1, 'At least one payment account is required'),
    }),
  }),
};

export const loginSchema = {
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
    branchCode: z.string().optional(),
  }),
};

export const refreshTokenSchema = {
  cookies: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }).optional(),
  body: z.object({
    refreshToken: z.string().optional(),
  }).optional(),
};
