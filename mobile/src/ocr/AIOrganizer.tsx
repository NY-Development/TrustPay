import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { WebView } from 'react-native-webview';

interface AIOrganizerProps {
  onProgress: (progress: number, statusText: string) => void;
  onReady: () => void;
  onResult: (text: string) => void;
  onError: (message: string) => void;
}

export interface AIOrganizerHandle {
  processText: (text: string) => void;
}

export const AIOrganizer = forwardRef<AIOrganizerHandle, AIOrganizerProps>(
  ({ onProgress, onReady, onResult, onError }, ref) => {
    const webViewRef = useRef<WebView>(null);

    useImperativeHandle(ref, () => ({
      processText: (text: string) => {
        webViewRef.current?.postMessage(JSON.stringify({ text }));
      },
    }));

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>TrustPay Offline WebGPU-LLM</title>
        <script type="module">
          import * as webllm from "https://esm.run/@mlc-ai/web-llm";
          
          let engine;
          
          async function initGemma() {
            try {
              console.log("Initializing web-llm engine...");
              
              // We check if GPU is supported first
              if (!navigator.gpu) {
                throw new Error("WebGPU is not supported on this device/runtime.");
              }

              engine = await webllm.CreateEngine("gemma-2b-it-q4f16_1-MLC", {
                initProgressCallback: (report) => {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ 
                    type: 'INIT_PROGRESS', 
                    progress: report.progress,
                    text: report.text 
                  }));
                }
              });
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'READY' }));
            } catch (err) {
              console.error("Gemma initialization error:", err);
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: err.message || err.toString() }));
            }
          }

          window.addEventListener("message", async (event) => {
            try {
              const { text } = JSON.parse(event.data);
              if (!engine) {
                throw new Error("Gemma engine not ready yet.");
              }
              
              const prompt = "You are a bank receipt parser engine. Extract fields (bank, transactionNumber, referenceNumber, amount, currency, senderName, receiverName, date) from this OCR text. Return only a raw JSON block: " + text;
              
              const reply = await engine.chat.completions.create({
                messages: [{ role: "user", content: prompt }]
              });

              const resultText = reply.choices[0]?.message?.content || "";
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'RESULT', text: resultText }));
            } catch (err) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: err.message || err.toString() }));
            }
          });

          initGemma();
        </script>
      </head>
      <body style="background-color: transparent;"></body>
      </html>
    `;

    return (
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        style={{ width: 0, height: 0, opacity: 0, position: 'absolute' }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'INIT_PROGRESS') {
              onProgress(data.progress, data.text);
            } else if (data.type === 'READY') {
              onReady();
            } else if (data.type === 'RESULT') {
              onResult(data.text);
            } else if (data.type === 'ERROR') {
              onError(data.message);
            }
          } catch (e) {
            console.error("[WebView onMessage parse error]", e);
          }
        }}
      />
    );
  }
);
