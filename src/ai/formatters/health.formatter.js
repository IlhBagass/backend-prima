import { defaultHealthFormat } from "./schema.js";

export function formatHealthResponse(rawText) {
  let parsed;

  try {
    parsed = JSON.parse(rawText);
  } catch (e) {
    console.error("❌ JSON parse gagal dari LLM:", rawText);

    return {
      ...defaultHealthFormat,
      user_message: rawText || "Tidak dapat memproses jawaban"
    };
  }

  return {
    user_message: parsed.user_message || "",

    possible_conditions: parsed.possible_conditions || [],

    what_you_can_do_now: parsed.what_you_can_do_now || [],

    when_to_see_doctor: parsed.when_to_see_doctor || [],

    recommended_checks: parsed.recommended_checks || [],

    health_insight: {
      title: parsed.health_insight?.title || "",
      description: parsed.health_insight?.description || ""
    },

    who_context: {
      indicator: parsed.who_context?.indicator || "",
      value: parsed.who_context?.value || null,
      unit: parsed.who_context?.unit || "",
      country: parsed.who_context?.country || "",
      year: parsed.who_context?.year || null
    },

    disclaimer:
      parsed.disclaimer || defaultHealthFormat.disclaimer
  };
}