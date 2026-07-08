/**
 * AI Provider — React Context for ExecuTorch
 *
 * This component hosts the ExecuTorch hooks (which must live inside
 * the React component tree) and exposes the AIOrganizer instance
 * to the rest of the app via `useAI()`.
 *
 * Mount <AIProvider> near the root of your app, after ExecuTorch
 * has been initialized with initExecutorch().
 */
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import type { AIStatus } from './ai-types';
import { aiOrganizer, AIOrganizer } from './AIOrganizer';
import { initRuntime, setStatus as setRuntimeStatus } from './local-model-server';
import { useLLM, LLAMA3_2_1B } from 'react-native-executorch';

// ─── Context ─────────────────────────────────────────────────────

interface AIContextValue {
  /** The shared AIOrganizer instance */
  organizer: AIOrganizer;
  /** Current AI runtime status */
  status: AIStatus;
  /** Error message if status is 'error' */
  error: string | null;
}

const AIContext = createContext<AIContextValue | undefined>(undefined);

// ─── Provider Component ──────────────────────────────────────────

interface AIProviderProps {
  children: React.ReactNode;
}

export function AIProvider({ children }: AIProviderProps) {
  const [status, setStatus] = useState<AIStatus>('uninitialized');
  const [error, setError] = useState<string | null>(null);
  const initRef = useRef(false);

  // Instantiating the ExecuTorch hook at component root with correct API parameters
  const llm = useLLM({
    model: LLAMA3_2_1B,
  });

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const bootstrap = async () => {
      try {
        setStatus('loading');
        aiOrganizer.setStatus('loading');
        setRuntimeStatus('loading');

        // Initialize ExecuTorch runtime
        await initRuntime();
      } catch (err: any) {
        const msg = err?.message || 'Failed to initialize AI runtime';
        console.error('[AIProvider] Init error:', msg);
        setError(msg);
        setStatus('error');
        aiOrganizer.setStatus('error');
        setRuntimeStatus('error');
      }
    };

    bootstrap();
  }, []);

  // Monitor ExecuTorch LLM hook state
  useEffect(() => {
    if (llm.isReady) {
      aiOrganizer.setGenerateFunction(async (prompt) => {
        await llm.generate([{ role: 'user', content: prompt }]);
        return llm.response || '';
      });

      setStatus('ready');
      aiOrganizer.setStatus('ready');
      setRuntimeStatus('ready');
      console.log('[AIProvider] AI runtime ready (ExecuTorch mode)');
    } else if (llm.error) {
      const msg = llm.error.message || String(llm.error);
      setError(msg);
      setStatus('error');
      aiOrganizer.setStatus('error');
      setRuntimeStatus('error');
      console.warn('[AIProvider] ExecuTorch error:', msg);
    }
  }, [llm.isReady, llm.error, llm.response]);

  return (
    <AIContext.Provider value={{ organizer: aiOrganizer, status, error }}>
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
 * const { organizer, status } = useAI();
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
