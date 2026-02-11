import { create } from 'jsondiffpatch';
import type { JsonValue } from './types';
import { sortKeys, parseJson } from './json';
import { findLabelSpans, extractJsonFromLabel, findCommonParent } from './dom';
import { renderJsonDiff } from './renderer';
import { createDiffWidget } from './ui';

(function () {
  if (!window.location.pathname.match(/\/projects\/[^/]+\/approvals\//)) {
    return;
  }

  console.log('[LD Diff] Approval page detected, initializing...');

  const diffpatch = create({
    objectHash: (obj: unknown) => JSON.stringify(obj),
  });

  function processPair(fromSpan: Element, toSpan: Element) {
    fromSpan.setAttribute('data-ld-diffed', 'true');
    toSpan.setAttribute('data-ld-diffed', 'true');

    const fromJsonStr = extractJsonFromLabel(fromSpan);
    const toJsonStr = extractJsonFromLabel(toSpan);

    if (!fromJsonStr || !toJsonStr) {
      console.warn('[LD Diff] Could not extract JSON from from/to pair');
      return;
    }

    let fromObj = parseJson(fromJsonStr);
    let toObj = parseJson(toJsonStr);

    if (fromObj === null || toObj === null) {
      console.warn('[LD Diff] Could not parse JSON from from/to pair');
      return;
    }

    fromObj = sortKeys(fromObj);
    toObj = sortKeys(toObj);

    const delta = diffpatch.diff(fromObj, toObj);

    const commonParent = findCommonParent(fromSpan, toSpan);

    if (!commonParent) {
      console.warn('[LD Diff] Could not find common parent for from/to pair');
      return;
    }

    const diffHtml = delta !== undefined ? renderJsonDiff(fromObj, toObj, delta) : undefined;
    const originalContent = commonParent.cloneNode(true);
    const wrapper = createDiffWidget(diffHtml, originalContent);

    commonParent.innerHTML = '';
    commonParent.style.display = 'block';
    commonParent.style.width = '100%';
    commonParent.appendChild(wrapper);
    commonParent.setAttribute('data-ld-diffed', 'true');

    console.log('[LD Diff] Diff rendered successfully');
  }

  function processAllPairs() {
    const labels = findLabelSpans();

    if (labels.fromSpans.length === 0 || labels.toSpans.length === 0) {
      return;
    }

    console.log('[LD Diff] Found', labels.fromSpans.length, 'from: and', labels.toSpans.length, 'to: labels');

    const pairCount = Math.min(labels.fromSpans.length, labels.toSpans.length);

    for (let i = 0; i < pairCount; i++) {
      processPair(labels.fromSpans[i], labels.toSpans[i]);
    }
  }

  processAllPairs();

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const observer = new MutationObserver(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      processAllPairs();
    }, 300);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  console.log('[LD Diff] MutationObserver active');
})();
