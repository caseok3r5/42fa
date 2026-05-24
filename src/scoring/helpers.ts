export function normalizeText(value: string | null | undefined) {
  return (value ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

export function extractMentions(text: string) {
  return Array.from(new Set((text.match(/@[a-z0-9._]+/gi) ?? []).map((mention) => mention.toLowerCase())));
}

export function includesAny(haystack: string, needles: string[]) {
  return needles.some((needle) => haystack.includes(needle));
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
