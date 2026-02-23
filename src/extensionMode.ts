import {
  createExtensionDiffView,
  createExtensionModeButton,
  setModeButtonSelected,
} from './ui';

type ExtensionPair = {
  parent: HTMLElement;
  view: HTMLElement;
};

type ExtensionRegistry = Map<string, ExtensionPair>;

type ExtensionModeManager = {
  mount: (commonParent: HTMLElement, modeButtonGroup: HTMLElement, diffHtml: string | undefined) => boolean;
};

export function createExtensionModeManager(): ExtensionModeManager {
  const extensionRegistries = new WeakMap<HTMLElement, ExtensionRegistry>();

  return {
    mount(commonParent: HTMLElement, modeButtonGroup: HTMLElement, diffHtml: string | undefined): boolean {
      const templateButton = modeButtonGroup.querySelector<HTMLButtonElement>(
        '[data-test-id="instruction-mode-button-json"], [data-test-id="instruction-mode-button-visual"]',
      );

      if (!templateButton) {
        return false;
      }

      const registry = getOrCreateExtensionRegistry(extensionRegistries, modeButtonGroup);
      pruneRegistry(registry);

      const key = commonParent.getAttribute('data-ld-extension-parent-key') || `ld-ext-${Math.random().toString(36).slice(2, 10)}`;
      commonParent.setAttribute('data-ld-extension-parent-key', key);

      const extensionView = createExtensionDiffView(diffHtml);
      extensionView.setAttribute('data-ld-extension-view-key', key);

      const existingPair = registry.get(key);

      if (existingPair?.view.isConnected) {
        existingPair.view.replaceWith(extensionView);
      } else {
        commonParent.insertAdjacentElement('afterend', extensionView);
      }

      registry.set(key, {
        parent: commonParent,
        view: extensionView,
      });

      let extensionButton = modeButtonGroup.querySelector<HTMLButtonElement>('[data-test-id="instruction-mode-button-extension"]');

      if (!extensionButton) {
        extensionButton = createExtensionModeButton(templateButton);
        modeButtonGroup.appendChild(extensionButton);
      }

      if (!modeButtonGroup.hasAttribute('data-ld-extension-delegate-bound')) {
        modeButtonGroup.addEventListener('click', (event) => {
          const target = (event.target as Element | null)?.closest('button[role="radio"]') as HTMLButtonElement | null;

          if (!target) {
            return;
          }

          const activeRegistry = extensionRegistries.get(modeButtonGroup);

          if (!activeRegistry) {
            return;
          }

          pruneRegistry(activeRegistry);

          const activeExtensionButton = modeButtonGroup.querySelector<HTMLButtonElement>('[data-test-id="instruction-mode-button-extension"]');

          if (!activeExtensionButton) {
            return;
          }

          if (target === activeExtensionButton) {
            const radioButtons = modeButtonGroup.querySelectorAll<HTMLButtonElement>('[role="radio"]');

            radioButtons.forEach((button) => {
              setModeButtonSelected(button, button === activeExtensionButton);
            });

            activeRegistry.forEach((pair) => {
              pair.parent.style.display = 'none';
              pair.view.style.display = 'block';
            });

            return;
          }

          if (
            target.getAttribute('data-test-id') === 'instruction-mode-button-visual' ||
            target.getAttribute('data-test-id') === 'instruction-mode-button-json'
          ) {
            activeRegistry.forEach((pair) => {
              pair.parent.style.display = '';
              pair.view.style.display = 'none';
            });

            setModeButtonSelected(activeExtensionButton, false);
          }
        });

        modeButtonGroup.setAttribute('data-ld-extension-delegate-bound', 'true');
      }

      const extensionSelected = extensionButton.getAttribute('aria-checked') === 'true';

      if (extensionSelected) {
        commonParent.style.display = 'none';
        extensionView.style.display = 'block';
      } else {
        commonParent.style.display = '';
        extensionView.style.display = 'none';
      }

      return true;
    },
  };
}

function getOrCreateExtensionRegistry(
  extensionRegistries: WeakMap<HTMLElement, ExtensionRegistry>,
  modeButtonGroup: HTMLElement,
): ExtensionRegistry {
  let registry = extensionRegistries.get(modeButtonGroup);

  if (!registry) {
    registry = new Map<string, ExtensionPair>();
    extensionRegistries.set(modeButtonGroup, registry);
  }

  return registry;
}

function pruneRegistry(registry: ExtensionRegistry): void {
  registry.forEach((pair, key) => {
    if (!pair.parent.isConnected || !pair.view.isConnected) {
      registry.delete(key);
    }
  });
}
