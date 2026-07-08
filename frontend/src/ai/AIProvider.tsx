/**
 * AIProvider — React Context Provider Manager
 *
 * Manages the AI provider lifecycle and exposes the AIOrganizer
 * instance to the React tree. Supports dependency injection via
 * the `provider` prop.
 *
 * Usage:
 *   <AIProvider provider="mock">     // Development
 *   <AIProvider provider="cloud">    // Cloud inference
 *   <AIProvider provider="gemma">    // Browser Gemma (future)
 *   <AIProvider>                     // Auto-detect best
 */
import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import type { AIStatus, AIProviderType } from './types/model.types';
import { AIOrganizer } from './AIOrganizer';

// ─── Context ─────────────────────────────────────────────────────

interface AIContextValue {
  /** The shared AIOrganizer instance */
  organizer: AIOrganizer;
  /** Current AI runtime status */
  status: AIStatus;
  /** Error message if status is 'error' */
  error: string | null;
  /** Active provider type */
  providerType: AIProviderType;
  /** Switch to a different provider at runtime */
  switchProvider: (type: AIProviderType) => Promise<void>;
}

const AIContext = createContext<AIContextValue | undefined>(undefined);

// ─── Auto-Detection ──────────────────────────────────────────────

function detectBestProvider(): AIProviderType {
  // If a cloud endpoint is configured, use cloud
  const endpoint = import.meta.env.VITE_AI_ENDPOINT;
  if (endpoint) return 'cloud';

  // Default to mock for development
  return 'mock';
}

// ─── Provider Component ──────────────────────────────────────────

interface AIProviderProps {
  children: React.ReactNode;
  /** Which provider to use. If omitted, auto-detects. */
  provider?: AIProviderType;
}

export function AIProvider({ children, provider: providerProp }: AIProviderProps) {
  const initialType = providerProp || detectBestProvider();
  const organizerRef = useRef(new AIOrganizer(initialType));

  const [status, setStatus] = useState<AIStatus>('uninitialized');
  const [error, setError] = useState<string | null>(null);
  const [providerType, setProviderType] = useState<AIProviderType>(initialType);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const bootstrap = async () => {
      try {
        setStatus('loading');
        await organizerRef.current.initialize();
        setStatus(organizerRef.current.status);
        setProviderType(organizerRef.current.providerType);
        console.log(`[AIProvider] Ready (${organizerRef.current.providerType})`);
      } catch (err: any) {
        const msg = err?.message || 'Failed to initialize AI';
        console.error('[AIProvider] Init error:', msg);
        setError(msg);
        setStatus('error');
      }
    };

    bootstrap();

    return () => {
      organizerRef.current.dispose();
    };
  }, []);

  const switchProvider = useCallback(async (type: AIProviderType) => {
    try {
      setStatus('loading');
      setError(null);
      await organizerRef.current.switchProvider(type);
      setStatus(organizerRef.current.status);
      setProviderType(type);
    } catch (err: any) {
      setError(err?.message || 'Provider switch failed');
      setStatus('error');
    }
  }, []);

  return (
    <AIContext.Provider value={{
      organizer: organizerRef.current,
      status,
      error,
      providerType,
      switchProvider,
    }}>
      {children}
    </AIContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────

/**
 * Access the AIOrganizer instance and current runtime status.
 *
 * @example
 * ```tsx
 * const { organizer, status, switchProvider } = useAI();
 * const receipt = await organizer.extractReceiptData(ocrText);
 * ```
 */
export function useAI(): AIContextValue {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an <AIProvider>');
  }
  return context;
}
