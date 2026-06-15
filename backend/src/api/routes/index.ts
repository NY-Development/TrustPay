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

  app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>TrustPay Verification API</title>

  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: Inter, system-ui, sans-serif;
    }

    body {
      min-height: 100vh;
      background: #0f172a;
      color: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }

    .container {
      width: 100%;
      max-width: 900px;
    }

    .card {
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 24px;
      padding: 48px;
      backdrop-filter: blur(10px);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
    }

    .badge {
      display: inline-block;
      padding: 8px 16px;
      background: rgba(34, 197, 94, 0.15);
      color: #4ade80;
      border: 1px solid rgba(74, 222, 128, 0.3);
      border-radius: 999px;
      font-size: 14px;
      margin-bottom: 20px;
    }

    h1 {
      font-size: 3rem;
      margin-bottom: 16px;
      font-weight: 800;
      background: linear-gradient(to right, #60a5fa, #22c55e);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    p {
      color: #cbd5e1;
      line-height: 1.7;
      margin-bottom: 30px;
      font-size: 1.05rem;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-top: 30px;
    }

    .feature {
      background: #111827;
      border: 1px solid rgba(148, 163, 184, 0.15);
      border-radius: 16px;
      padding: 20px;
    }

    .feature h3 {
      color: #60a5fa;
      margin-bottom: 10px;
      font-size: 1rem;
    }

    .feature p {
      margin: 0;
      font-size: 0.95rem;
    }

    .footer {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid rgba(148, 163, 184, 0.15);
      color: #94a3b8;
      font-size: 14px;
    }

    code {
      background: #1e293b;
      padding: 4px 8px;
      border-radius: 6px;
      color: #60a5fa;
    }

    @media (max-width: 768px) {
      .card {
        padding: 32px 24px;
      }

      h1 {
        font-size: 2.2rem;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <span class="badge">🟢 API Online</span>

      <h1>TrustPay Verification API</h1>

      <p>
        Secure payment verification platform that validates transaction IDs,
        QR-code payments, screenshots, and payment notifications in real time.
        Built to help merchants instantly verify customer payments and reduce
        fraud.
      </p>

      <div class="grid">
        <div class="feature">
          <h3>Transaction Verification</h3>
          <p>Verify payment references and transaction IDs instantly.</p>
        </div>

        <div class="feature">
          <h3>QR Payment Validation</h3>
          <p>Confirm QR-based payments from supported providers.</p>
        </div>

        <div class="feature">
          <h3>Screenshot Analysis</h3>
          <p>Extract and validate payment details using OCR and AI.</p>
        </div>

        <div class="feature">
          <h3>Merchant Dashboard</h3>
          <p>Track payment activity, verification logs, and fraud alerts.</p>
        </div>
      </div>

      <div class="footer">
        API Status: <strong>Operational</strong><br>
        Base Endpoint: <code>/api/v1</code><br>
        Environment: <code>Production</code>
      </div>
    </div>
  </div>
</body>
</html>`);
  });
};
