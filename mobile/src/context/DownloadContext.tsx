import React, { createContext, useContext, useState } from 'react';
import { downloadModel, DownloadProgress, AIModelId } from '@/src/ocr/model-download-manager';

type DownloadContextType = {
  downloadingModelId: AIModelId | null;
  progress: DownloadProgress | null;
  startGlobalDownload: (modelId: AIModelId) => Promise<void>;
};

const DownloadContext = createContext<DownloadContextType | undefined>(undefined);

export function DownloadProvider({ children }: { children: React.ReactNode }) {
  const [downloadingModelId, setDownloadingModelId] = useState<AIModelId | null>(null);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);

  const startGlobalDownload = async (modelId: AIModelId) => {
    // If already downloading this or another model, ignore new requests
    if (downloadingModelId) return; 

    setDownloadingModelId(modelId);
    try {
      await downloadModel(modelId, (nextProgress) => {
        setProgress(nextProgress);
      });
    } catch (error) {
      console.error("Global background download failed:", error);
    } finally {
      // Clear tracking states once complete
      setDownloadingModelId(null);
      setProgress(null);
    }
  };

  return (
    <DownloadContext.Provider value={{ downloadingModelId, progress, startGlobalDownload }}>
      {children}
    </DownloadContext.Provider>
  );
}

export const useGlobalDownload = () => {
  const context = useContext(DownloadContext);
  if (!context) throw new Error('useGlobalDownload must be used within a DownloadProvider');
  return context;
};