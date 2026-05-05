
import { formatHealthResponse } from "./health.formatter.js";


export function formatAIResponse(type, rawText) {
  switch (type) {
    case "health":
      return formatHealthResponse(rawText);

    default:
      return {
        message: rawText
      };
  }
}