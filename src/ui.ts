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
