import type { JsonValue, LineType } from './types';
import type { Delta, ObjectDelta, ArrayDelta } from './delta';
import { isAdded, isDeleted, isModified, isMoved, isArray, isObject } from './delta';

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function makeLine(type: LineType, indent: number, content: string): string {
  const gutter = type === 'added' ? '+' : type === 'removed' ? '-' : ' ';
  let pad = '';

  for (let i = 0; i < indent; i++) { pad += '  '; }

  return '<div class="diff-line diff-line-' + type + '">' +
    '<span class="diff-gutter">' + gutter + '</span>' +
    '<span class="diff-content">' + pad + content + '</span></div>';
}

function jsonLines(value: JsonValue, indent: number, type: LineType, trailing: string): string[] {
  const trail = trailing || '';

  if (value === null) return [makeLine(type, indent, escapeHtml('null') + trail)];
  if (typeof value === 'string') return [makeLine(type, indent, escapeHtml('"' + value + '"') + trail)];
  if (typeof value === 'number' || typeof value === 'boolean') return [makeLine(type, indent, escapeHtml(String(value)) + trail)];

  let lines: string[] = [];

  if (Array.isArray(value)) {
    if (value.length === 0) {
      lines.push(makeLine(type, indent, '[]' + trail));
    } else {
      lines.push(makeLine(type, indent, '['));

      for (let i = 0; i < value.length; i++) {
        const comma = i < value.length - 1 ? ',' : '';
        lines = lines.concat(jsonLines(value[i], indent + 1, type, comma));
      }

      lines.push(makeLine(type, indent, ']' + trail));
    }
  } else {
    const keys = Object.keys(value);

    if (keys.length === 0) {
      lines.push(makeLine(type, indent, '{}' + trail));
    } else {
      lines.push(makeLine(type, indent, '{'));

      for (let k = 0; k < keys.length; k++) {
        const key = keys[k];
        const comma = k < keys.length - 1 ? ',' : '';
        const prefix = escapeHtml('"' + key + '"') + ': ';
        const val = value[key];

        if (val !== null && typeof val === 'object') {
          const innerOpen = Array.isArray(val) ? '[' : '{';
          lines.push(makeLine(type, indent + 1, prefix + innerOpen));
          const sub = jsonLines(val, indent + 2, type, comma);

          for (let s = 1; s < sub.length; s++) {
            lines.push(sub[s]);
          }
        } else {
          const valStr = val === null ? 'null' : typeof val === 'string' ? escapeHtml('"' + val + '"') : escapeHtml(String(val));
          lines.push(makeLine(type, indent + 1, prefix + valStr + comma));
        }
      }

      lines.push(makeLine(type, indent, '}' + trail));
    }
  }

  return lines;
}

function extractInnerContent(line: string): string {
  const match = line.match(/<span class="diff-content">([^]*?)<\/span>/);
  return match ? match[1].trim() : '';
}

function renderValueDiff(key: string, value: JsonValue, indent: number, type: LineType, comma: string): string[] {
  const prefix = escapeHtml('"' + key + '"') + ': ';
  const valLines = jsonLines(value, indent, type, comma);

  if (valLines.length === 1) {
    return [makeLine(type, indent, prefix + extractInnerContent(valLines[0]))];
  }

  const openBracket = Array.isArray(value) ? '[' : '{';
  const result = [makeLine(type, indent, prefix + openBracket)];

  for (let i = 1; i < valLines.length; i++) {
    result.push(valLines[i]);
  }

  return result;
}

export function renderJsonDiff(fromObj: JsonValue, toObj: JsonValue, delta: Delta): string {
  let lines: string[] = [];

  function renderObject(from: Record<string, JsonValue>, to: Record<string, JsonValue>, d: ObjectDelta, indent: number, trailing: string) {
    lines.push(makeLine('context', indent, '{'));

    const allKeys = Object.keys(to || {});
    const fromKeys = Object.keys(from || {});

    fromKeys.forEach((k) => {
      if (allKeys.indexOf(k) === -1) allKeys.push(k);
    });
    allKeys.sort();

    let hasEllipsisBefore = false;

    for (let i = 0; i < allKeys.length; i++) {
      const key = allKeys[i];

      if (!(key in d)) {
        if (!hasEllipsisBefore) {
          lines.push(makeLine('context', indent + 1, escapeHtml('...')));
          hasEllipsisBefore = true;
        }
        continue;
      }

      hasEllipsisBefore = false;
      const sub = d[key];
      const comma = ',';

      if (isAdded(sub)) {
        lines = lines.concat(renderValueDiff(key, sub[0] as JsonValue, indent + 1, 'added', comma));
      } else if (isDeleted(sub)) {
        lines = lines.concat(renderValueDiff(key, sub[0] as JsonValue, indent + 1, 'removed', comma));
      } else if (isModified(sub)) {
        lines = lines.concat(renderValueDiff(key, sub[0] as JsonValue, indent + 1, 'removed', comma));
        lines = lines.concat(renderValueDiff(key, sub[1] as JsonValue, indent + 1, 'added', comma));
      } else if (isArray(sub)) {
        const prefix = escapeHtml('"' + key + '"') + ': ';
        lines.push(makeLine('context', indent + 1, prefix + '['));
        renderArrayDiff(from[key] as JsonValue[] || [], to[key] as JsonValue[] || [], sub, indent + 2);
        lines.push(makeLine('context', indent + 1, ']' + comma));
      } else if (isObject(sub)) {
        const prefix = escapeHtml('"' + key + '"') + ': ';
        const beforeLen = lines.length;
        renderObject(from[key] as Record<string, JsonValue> || {}, to[key] as Record<string, JsonValue> || {}, sub, indent + 1, comma);

        if (lines.length > beforeLen) {
          lines[beforeLen] = makeLine('context', indent + 1, prefix + '{');
        }
      }
    }

    lines.push(makeLine('context', indent, '}' + trailing));
  }

  function renderArrayDiff(_fromArr: JsonValue[], toArr: JsonValue[], d: ArrayDelta, indent: number) {
    const addedIndices: Record<number, JsonValue> = {};
    const removedIndices: Record<number, JsonValue> = {};

    Object.keys(d).forEach((k) => {
      if (k === '_t') return;
      const val = d[k as keyof ArrayDelta] as Delta;

      if (k.charAt(0) === '_') {
        const oldIdx = parseInt(k.substring(1), 10);

        if (isMoved(val)) {
          // Moved — treat as unchanged
        } else if (isDeleted(val)) {
          removedIndices[oldIdx] = val[0] as JsonValue;
        }
      } else {
        const newIdx = parseInt(k, 10);

        if (isAdded(val)) {
          addedIndices[newIdx] = val[0] as JsonValue;
        }
      }
    });

    let hasContextBefore = false;
    const removedKeys = Object.keys(removedIndices).map(Number).sort((a, b) => a - b);
    const addedKeys = Object.keys(addedIndices).map(Number).sort((a, b) => a - b);

    for (let r = 0; r < removedKeys.length; r++) {
      if (!hasContextBefore && removedKeys[r] > 0) {
        lines.push(makeLine('context', indent, escapeHtml('...')));
        hasContextBefore = true;
      }

      lines = lines.concat(jsonLines(removedIndices[removedKeys[r]], indent, 'removed', ','));
    }

    for (let a = 0; a < addedKeys.length; a++) {
      if (!hasContextBefore) {
        lines.push(makeLine('context', indent, escapeHtml('...')));
        hasContextBefore = true;
      }

      lines = lines.concat(jsonLines(addedIndices[addedKeys[a]], indent, 'added', ','));
    }

    if (toArr.length > Object.keys(addedIndices).length + Object.keys(removedIndices).length) {
      lines.push(makeLine('context', indent, escapeHtml('...')));
    }
  }

  if (isObject(delta)) {
    renderObject(fromObj as Record<string, JsonValue>, toObj as Record<string, JsonValue>, delta, 0, '');
  }

  return lines.join('\n');
}
