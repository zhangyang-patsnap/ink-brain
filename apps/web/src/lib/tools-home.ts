import { matchesTool } from './tool-search.mjs';

export function initToolsHome() {
  document.querySelectorAll<HTMLElement>('[data-tools-home]').forEach(root => {
    if (root.dataset.ready) return;
    const controls = root.querySelector<HTMLElement>('[data-tools-controls]');
    const input = root.querySelector<HTMLInputElement>('[data-tools-query]');
    const clear = root.querySelector<HTMLButtonElement>('[data-tools-clear]');
    const empty = root.querySelector<HTMLElement>('[data-tools-empty]');
    const status = root.querySelector<HTMLElement>('[data-tools-status]');
    const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-tool-card]'));
    const categories = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-tool-category]'));
    if (!controls || !input || !clear || !empty || !status) return;
    let category = 'all';
    let composing = false;

    const render = () => {
      let count = 0;
      cards.forEach(card => {
        const match = matchesTool(card.dataset.kind, card.dataset.search ?? '', category, input.value);
        card.hidden = !match;
        card.classList.toggle('is-featured', match && count === 0);
        if (match) count++;
      });
      categories.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.toolCategory === category)));
      clear.hidden = input.value.length === 0;
      empty.hidden = count !== 0;
      status.textContent = `显示 ${count} 项工具，共 ${cards.length} 项`;
    };

    categories.forEach(button => button.addEventListener('click', () => {
      category = button.dataset.toolCategory ?? 'all';
      render();
    }));
    input.addEventListener('compositionstart', () => { composing = true; });
    input.addEventListener('compositionend', () => { composing = false; render(); });
    input.addEventListener('input', () => { if (!composing) render(); });
    clear.addEventListener('click', () => { input.value = ''; composing = false; render(); input.focus(); });
    root.querySelector('[data-tools-reset]')?.addEventListener('click', () => {
      category = 'all';
      input.value = '';
      composing = false;
      render();
      input.focus();
    });
    root.dataset.ready = 'true';
    controls.hidden = false;
    render();
  });
}
