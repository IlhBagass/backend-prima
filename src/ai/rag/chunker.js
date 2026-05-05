export const splitText = (text, size = 500) => {
  const chunks = [];

  for (let i = 0; i < text.length; i += size) {
    const part = text.slice(i, i + size);

    if (part.trim().length > 50) {
      chunks.push(part);
    }
  }

  return chunks;
};