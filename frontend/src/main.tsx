import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { QueryProvider } from './providers/QueryProvider';
import { AuthProvider } from './providers/AuthProvider';
import { AIProvider } from './ai/AIProvider'; // 👈 IMPORTED
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryProvider>
      <AuthProvider>
        <AIProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AIProvider>
      </AuthProvider>
    </QueryProvider>
  </React.StrictMode>
);

