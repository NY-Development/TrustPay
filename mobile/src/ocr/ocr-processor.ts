import { recognizeText } from '@infinitered/react-native-mlkit-text-recognition';

export interface OCRResult {
  text: string;
}

export const runOCR = async (imageUri: string): Promise<OCRResult> => {
  // Add a timeout promise to prevent infinite hanging
  const timeout = new Promise((_, reject) => 
    setTimeout(() => reject(new Error("OCR Processing timed out - check native link")), 10000)
  );

  try {
    // Race the OCR call against the timeout
    const result = await Promise.race([recognizeText(imageUri), timeout]) as any;
    
    return {
      text: result?.text || "",
    };
  } catch (error) {
    console.error("ML Kit OCR Error:", error);
    throw error; // Propagate to screen
  }
};