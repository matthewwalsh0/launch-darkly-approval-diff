import type { JsonValue } from './types';

export function sortKeys(obj: JsonValue): JsonValue {
  if (Array.isArray(obj)) return obj.map(sortKeys);

  if (obj !== null && typeof obj === 'object') {
    const sorted: Record<string, JsonValue> = {};

    Object.keys(obj).sort().forEach((key) => {
      sorted[key] = sortKeys(obj[key]);
    });

    return sorted;
  }

  return obj;
}

export function parseJson(jsonStr: string): JsonValue | null {
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.warn('[LD Diff] Failed to parse JSON:', (e as Error).message);
    return null;
  }
}
