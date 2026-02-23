export function createDiffWidget(diffHtml: string | undefined, originalContent: Node): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'ld-diff-wrapper';
  wrapper.setAttribute('data-ld-diffed', 'true');

  const header = document.createElement('div');
  header.className = 'ld-diff-header';

  const title = document.createElement('span');
  title.className = 'ld-diff-title';
  title.textContent = 'JSON Diff';

  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'ld-diff-toggle';
  toggleBtn.textContent = 'Show Original';
  toggleBtn.type = 'button';

  header.appendChild(title);
  header.appendChild(toggleBtn);

  const diffOutput = document.createElement('div');
  diffOutput.className = 'ld-diff-output';

  if (diffHtml === undefined) {
    const noChanges = document.createElement('div');
    noChanges.className = 'ld-diff-no-changes';
    noChanges.textContent = 'No changes \u2014 values are identical';
    diffOutput.appendChild(noChanges);
  } else {
    diffOutput.innerHTML = diffHtml;
  }

  const originalContainer = document.createElement('div');
  originalContainer.className = 'ld-diff-original';
  originalContainer.style.display = 'none';
  originalContainer.appendChild(originalContent);

  let showingDiff = true;

  toggleBtn.addEventListener('click', () => {
    showingDiff = !showingDiff;

    if (showingDiff) {
      diffOutput.style.display = '';
      originalContainer.style.display = 'none';
      toggleBtn.textContent = 'Show Original';
    } else {
      diffOutput.style.display = 'none';
      originalContainer.style.display = '';
      toggleBtn.textContent = 'Show Diff';
    }
  });

  wrapper.appendChild(header);
  wrapper.appendChild(diffOutput);
  wrapper.appendChild(originalContainer);

  return wrapper;
}

export function createExtensionDiffView(diffHtml: string | undefined): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'ld-diff-wrapper ld-extension-view';
  wrapper.setAttribute('data-ld-diffed', 'true');

  const header = document.createElement('div');
  header.className = 'ld-diff-header';

  const title = document.createElement('span');
  title.className = 'ld-diff-title';
  title.textContent = 'JSON Diff';

  header.appendChild(title);

  const diffOutput = document.createElement('div');
  diffOutput.className = 'ld-diff-output';

  if (diffHtml === undefined) {
    const noChanges = document.createElement('div');
    noChanges.className = 'ld-diff-no-changes';
    noChanges.textContent = 'No changes - values are identical';
    diffOutput.appendChild(noChanges);
  } else {
    diffOutput.innerHTML = diffHtml;
  }

  wrapper.appendChild(header);
  wrapper.appendChild(diffOutput);

  return wrapper;
}

export function createExtensionModeButton(templateButton: HTMLButtonElement): HTMLButtonElement {
  const button = document.createElement('button');
  button.className = templateButton.className;
  button.type = 'button';
  button.textContent = 'Extension';
  button.setAttribute('data-test-id', 'instruction-mode-button-extension');
  button.setAttribute('role', 'radio');
  button.setAttribute('aria-checked', 'false');
  button.setAttribute('aria-label', 'Extension diff');

  if (templateButton.hasAttribute('data-rac')) {
    button.setAttribute('data-rac', '');
  }

  if (templateButton.hasAttribute('tabindex')) {
    button.setAttribute('tabindex', templateButton.getAttribute('tabindex') || '0');
  } else {
    button.setAttribute('tabindex', '0');
  }

  return button;
}

export function setModeButtonSelected(button: HTMLButtonElement, selected: boolean): void {
  button.setAttribute('aria-checked', selected ? 'true' : 'false');

  if (selected) {
    button.setAttribute('data-selected', 'true');
    return;
  }

  button.removeAttribute('data-selected');
}
