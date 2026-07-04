import { Subscription } from '../models/Subscription';

export interface AccessInfo {
  allowed: boolean;
  source: 'trial' | 'subscription';
  daysLeft?: number;
  subscription?: any;
}

declare global {
  namespace Express {
    interface Request {
      access?: {
        allowed: boolean;
        source: 'trial' | 'subscription';
        daysLeft?: number;
        subscription?: any;
      };
    }
  }
}

export {};