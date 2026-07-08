/**
 * OCR Processor — ML Kit Text Recognition Wrapper
 *
 * Kept intact from the original implementation.
 * Responsible ONLY for extracting raw text from images.
 * Does NOT perform any AI inference.
 */
import { recognizeText } from '@infinitered/react-native-mlkit-text-recognition';

export interface OCRResult {
  text: string;
}

/**
 * Extract raw text from an image using ML Kit OCR.
 * @param imageUri - Local file URI of the image to process.
 * @returns The extracted text string.
 */
export const extractText = async (imageUri: string): Promise<string> => {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error('OCR Processing timed out — check native link')),
      15000,
    ),
  );

  const result = (await Promise.race([
    recognizeText(imageUri),
    timeout,
  ])) as any;

  return result?.text || '';
};

/**
 * Legacy-compatible OCR runner.
 * @deprecated Use `extractText` instead.
 */
export const runOCR = async (imageUri: string): Promise<OCRResult> => {
  const text = await extractText(imageUri);
  return { text };
};
