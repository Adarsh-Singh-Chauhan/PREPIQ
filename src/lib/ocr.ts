// OCR utility — placeholder for future image-to-text feature
// This module is not currently used by any page.
// When needed, install tesseract.js: npm install tesseract.js

export const extractTextFromImage = async (imagePathOrBuffer: string | Buffer | File): Promise<string> => {
  try {
    // Dynamic import to avoid build errors when tesseract.js is not installed
    const Tesseract = (await import('tesseract.js' as string)).default;
    const result = await Tesseract.recognize(
      imagePathOrBuffer,
      'eng',
      { logger: (m: any) => console.log(m) }
    );
    return result.data.text;
  } catch {
    return "OCR is not available. Install tesseract.js to enable: npm install tesseract.js";
  }
};
