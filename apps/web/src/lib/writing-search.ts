import { matchesArticle, normalizeSearch } from './article-search.mjs';

export function setupWritingSearch(root: HTMLElement) {
  const form = root.querySelector<HTMLFormElement>('[data-writing-search]');
  const input = form?.querySelector<HTMLInputElement>('input');
  const lead = root.querySelector<HTMLElement>('[data-writing-lead]');
  const collection = root.querySelector<HTMLElement>('[data-writing-collection]');
  const heading = root.querySelector<HTMLElement>('[data-writing-list-title]');
  const count = root.querySelector<HTMLElement>('[data-writing-count]');
  const empty = root.querySelector<HTMLElement>('[data-writing-empty]');
  if (!form || !input || !lead || !collection || !heading || !count || !empty) return;
  const cards = [...root.querySelectorAll<HTMLElement>('[data-writing-card]')];
  const clear = form.querySelector<HTMLButtonElement>('[data-writing-clear]');

  const update = () => {
    const query = normalizeSearch(input.value);
    let visible = 0;
    for (const card of cards) {
      card.hidden = query ? !matchesArticle(card.dataset.searchText ?? '', query) : card.dataset.isLead === 'true';
      if (!card.hidden) visible++;
    }
    lead.hidden = Boolean(query);
    collection.hidden = !query && visible === 0;
    heading.textContent = query ? '搜索结果' : '继续阅读';
    count.textContent = query ? `找到 ${visible} 篇文章` : `${visible} 篇文章 · 按时间排序`;
    empty.hidden = !query || visible > 0;
    if (clear) clear.hidden = !input.value;
  };

  // Native IME composition should finish before filtering Chinese input.
  input.addEventListener('input', (event) => {
    if (!(event instanceof InputEvent) || !event.isComposing) update();
  });
  input.addEventListener('compositionend', update);
  form.addEventListener('submit', (event) => { event.preventDefault(); update(); });
  root.querySelectorAll<HTMLButtonElement>('[data-writing-clear]').forEach(button => {
    button.addEventListener('click', () => { input.value = ''; update(); input.focus(); });
  });
  form.hidden = false;
  update();
}
