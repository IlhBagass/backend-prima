export const extractTextFromBuffer = async (buffer) => {
  const PDFParser = await import("pdf2json");

  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser.default();

    pdfParser.on("pdfParser_dataError", (errData) => {
      reject(new Error(errData.parserError));
    });

    pdfParser.on("pdfParser_dataReady", (pdfData) => {
      let text = "";

      if (pdfData.Pages) {
        pdfData.Pages.forEach((page) => {
          if (page.Texts) {
            page.Texts.forEach((textItem) => {
              if (textItem.R && textItem.R.length > 0) {
                textItem.R.forEach((r) => {
                  if (r.T) {
                    text += decodeURIComponent(r.T) + " ";
                  }
                });
              }
            });
          }
        });
      }

      resolve(text.trim());
    });

    pdfParser.parseBuffer(buffer);
  });
};
