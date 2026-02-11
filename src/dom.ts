export function findLabelSpans(): { fromSpans: Element[]; toSpans: Element[] } {
  const allSpans = document.querySelectorAll('span');
  const fromSpans: Element[] = [];
  const toSpans: Element[] = [];

  for (let i = 0; i < allSpans.length; i++) {
    const span = allSpans[i];

    if (span.closest('[data-ld-diffed="true"]')) {
      continue;
    }

    const text = span.textContent?.trim();

    if (text === 'from:') {
      fromSpans.push(span);
    } else if (text === 'to:') {
      toSpans.push(span);
    }
  }

  return { fromSpans, toSpans };
}

export function extractJsonFromLabel(labelSpan: Element): string | null {
  const sibling = labelSpan.nextElementSibling;

  if (!sibling) {
    console.warn('[LD Diff] No sibling found for label:', labelSpan.textContent);
    return null;
  }

  let codeEl: Element | null = sibling.querySelector('code.language-json');

  if (!codeEl) {
    const preEl = sibling.querySelector('pre.language-json');

    if (preEl) {
      codeEl = preEl.querySelector('code') || preEl;
    }
  }

  if (!codeEl) {
    console.warn('[LD Diff] No code.language-json found in sibling of:', labelSpan.textContent);
    return null;
  }

  return codeEl.textContent;
}

export function findCommonParent(fromSpan: Element, toSpan: Element): HTMLElement | null {
  let parent = fromSpan.parentElement;

  while (parent && parent !== document.body) {
    if (parent.contains(toSpan)) {
      return parent;
    }

    parent = parent.parentElement;
  }

  return null;
}
