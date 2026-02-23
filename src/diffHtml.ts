import type { Delta } from './delta';
import { parseJson, sortKeys } from './json';
import { renderJsonDiff } from './renderer';
import type { JsonValue } from './types';

type DiffEngine = {
  diff: (left: JsonValue, right: JsonValue) => Delta | undefined;
};

export function buildDiffHtml(diffEngine: DiffEngine, fromJsonStr: string, toJsonStr: string): string | undefined | null {
  let fromObj = parseJson(fromJsonStr);
  let toObj = parseJson(toJsonStr);

  if (fromObj === null || toObj === null) {
    return null;
  }

  fromObj = sortKeys(fromObj);
  toObj = sortKeys(toObj);

  const delta = diffEngine.diff(fromObj, toObj);

  return delta !== undefined ? renderJsonDiff(fromObj, toObj, delta) : undefined;
}
