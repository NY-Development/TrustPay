import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { WebView } from 'react-native-webview';
import type { AIModelId } from './model-download-manager';

// Re-export for convenience
export type { AIModelId } from './model-download-manager';
export { AI_MODELS } from './model-download-manager';

interface AIOrganizerProps {
  modelId: AIModelId;
  /** Local server base URL, e.g. "http://localhost:34521/" */
  localBaseUrl?: string;
  onProgress: (progress: number, statusText: string) => void;
  onReady: () => void;
  onResult: (text: string) => void;
  onError: (message: string) => void;
}

export interface AIOrganizerHandle {
  processText: (text: string) => void;
}

export const AIOrganizer = forwardRef<AIOrganizerHandle, AIOrganizerProps>(
  ({ modelId, localBaseUrl, onProgress, onReady, onResult, onError }, ref) => {
    const webViewRef = useRef<WebView>(null);

    useImperativeHandle(ref, () => ({
      processText: (text: string) => {
        webViewRef.current?.postMessage(JSON.stringify({ type: 'PROCESS', text }));
      },
    }));

    // Build the engine options JS literal
    const engineOptionsJs = localBaseUrl
      ? `{
           baseUrl: "${localBaseUrl}",
           initProgressCallback: (report) => {
             window.ReactNativeWebView.postMessage(JSON.stringify({
               type: 'INIT_PROGRESS',
               progress: report.progress,
               text: report.text
             }));
           }
         }`
      : `{
           initProgressCallback: (report) => {
             window.ReactNativeWebView.postMessage(JSON.stringify({
               type: 'INIT_PROGRESS',
               progress: report.progress,
               text: report.text
             }));
           }
         }`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>TrustPay Local AI</title>
        <script type="module">
          import * as webllm from "https://esm.run/@mlc-ai/web-llm";

          let engine;
          const MODEL_ID = "${modelId}";

          async function init() {
            try {
              if (!navigator.gpu) {
                throw new Error("WebGPU is not supported on this device.");
              }

              engine = await webllm.CreateEngine(MODEL_ID, ${engineOptionsJs});
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'READY' }));
            } catch (err) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'ERROR',
                message: err.message || String(err)
              }));
            }
          }

          window.addEventListener("message", async (event) => {
            try {
              const msg = JSON.parse(event.data);
              if (msg.type !== 'PROCESS') return;
              if (!engine) throw new Error("Engine not ready.");

              const prompt = "You are a bank receipt parser. Extract these fields from this OCR text: bank, transactionNumber, referenceNumber, amount, currency, senderName, receiverName, date. Return ONLY a raw JSON object, no markdown, no explanation.\\n\\n" + msg.text;

              const reply = await engine.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                temperature: 0.1
              });

              const resultText = reply.choices[0]?.message?.content || "";
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'RESULT', text: resultText }));
            } catch (err) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'ERROR',
                message: err.message || String(err)
              }));
            }
          });

          init();
        </script>
      </head>
      <body style="background:transparent;"></body>
      </html>
    `;

    return (
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        style={{ width: 0, height: 0, opacity: 0, position: 'absolute' }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        mixedContentMode="always"
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'INIT_PROGRESS') onProgress(data.progress, data.text);
            else if (data.type === 'READY') onReady();
            else if (data.type === 'RESULT') onResult(data.text);
            else if (data.type === 'ERROR') onError(data.message);
          } catch (e) {
            console.error("[WebView onMessage parse error]", e);
          }
        }}
      />
    );
  }
);
