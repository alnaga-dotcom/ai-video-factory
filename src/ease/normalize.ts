export interface EaseRule {
  id: string;
  source: string;
  replacement: string;
  note?: string;
}

export function normalizeEgyptianArabic(text: string, rules: readonly EaseRule[]): string {
  return rules.reduce((value, rule) => value.replaceAll(rule.source, rule.replacement), text).trim();
}
