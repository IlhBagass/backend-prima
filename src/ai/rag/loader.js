const ensurePdfJsNodePolyfills = async () => {
  const { DOMMatrix, ImageData, Path2D } = await import("@napi-rs/canvas");

  if (!globalThis.DOMMatrix) globalThis.DOMMatrix = DOMMatrix;
  if (!globalThis.ImageData) globalThis.ImageData = ImageData;
  if (!globalThis.Path2D) globalThis.Path2D = Path2D;
};

export const extractTextFromBuffer = async (buffer) => {
  await ensurePdfJsNodePolyfills();

  const { PDFParse } = await import("pdf-parse");

  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();
  return result.text;
};
