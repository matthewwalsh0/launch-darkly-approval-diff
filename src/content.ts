import { create } from 'jsondiffpatch';
import { findLabelSpans, extractJsonFromLabel, findCommonParent, findModeButtonGroup } from './dom';
import { createDiffWidget } from './ui';
import { buildDiffHtml } from './diffHtml';
import { createExtensionModeManager } from './extensionMode';

(function () {
  if (!window.location.pathname.match(/\/projects\/[^/]+\/approvals\//)) {
    return;
  }

  console.log('[LD Diff] Approval page detected, initializing...');

  const diffpatch = create({
    objectHash: (obj: unknown) => JSON.stringify(obj),
  });
  const extensionModeManager = createExtensionModeManager();

  function processPair(fromSpan: Element, toSpan: Element) {
    const fromJsonStr = extractJsonFromLabel(fromSpan);
    const toJsonStr = extractJsonFromLabel(toSpan);

    if (!fromJsonStr || !toJsonStr) {
      console.warn('[LD Diff] Could not extract JSON from from/to pair');
      return;
    }

    const diffHtml = buildDiffHtml(diffpatch, fromJsonStr, toJsonStr);

    if (diffHtml === null) {
      console.warn('[LD Diff] Could not parse JSON from from/to pair');
      return;
    }

    const commonParent = findCommonParent(fromSpan, toSpan);

    if (!commonParent) {
      console.warn('[LD Diff] Could not find common parent for from/to pair');
      return;
    }

    const modeButtonGroup = findModeButtonGroup(fromSpan, toSpan);

    if (modeButtonGroup && extensionModeManager.mount(commonParent, modeButtonGroup, diffHtml)) {
      markProcessed(fromSpan, toSpan, commonParent);

      console.log('[LD Diff] Extension mode rendered successfully');
      return;
    }

    renderFallbackDiff(commonParent, diffHtml);
    markProcessed(fromSpan, toSpan, commonParent);

    console.log('[LD Diff] Diff rendered successfully');
  }

  function markProcessed(fromSpan: Element, toSpan: Element, commonParent: HTMLElement) {
    fromSpan.setAttribute('data-ld-diffed', 'true');
    toSpan.setAttribute('data-ld-diffed', 'true');
    commonParent.setAttribute('data-ld-diffed', 'true');
  }

  function renderFallbackDiff(commonParent: HTMLElement, diffHtml: string | undefined) {
    const originalContent = commonParent.cloneNode(true);
    const wrapper = createDiffWidget(diffHtml, originalContent);

    commonParent.innerHTML = '';
    commonParent.style.display = 'block';
    commonParent.style.width = '100%';
    commonParent.appendChild(wrapper);
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
