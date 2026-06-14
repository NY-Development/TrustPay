import { Express } from 'express';
import authRoutes from './auth.routes';
import businessRoutes from './business.routes';
import branchRoutes from './branch.routes';
import verificationRoutes from './verification.routes';

export const setupRoutes = (app: Express) => {
  const API_PREFIX = '/api/v1';

  app.use(`${API_PREFIX}/auth`, authRoutes);
  app.use(`${API_PREFIX}/businesses`, businessRoutes);
  app.use(`${API_PREFIX}/branches`, branchRoutes);
  app.use(`${API_PREFIX}/verifications`, verificationRoutes);

  // Health check
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
  });
};
