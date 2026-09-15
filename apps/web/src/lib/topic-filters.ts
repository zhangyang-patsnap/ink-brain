export function setupTopicFilters(root: HTMLElement) {
  const bar = root.querySelector<HTMLElement>('[data-topic-filter-bar]');
  const status = root.querySelector<HTMLElement>('[data-topic-filter-status]');
  const empty = root.querySelector<HTMLElement>('[data-topic-filter-empty]');
  const emptyText = root.querySelector<HTMLElement>('[data-topic-filter-empty-text]');
  const list = root.querySelector<HTMLOListElement>('#topic-guide-results');
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-topic-filter]')];
  const items = [...root.querySelectorAll<HTMLLIElement>('[data-topic-item]')];
  if (!bar || !status || !empty || !emptyText || !list || !buttons.length || !items.length || root.dataset.topicFiltersReady) return;
  root.dataset.topicFiltersReady = 'true';

  const select = (type: string) => {
    let visible = 0;
    for (const item of items) {
      item.hidden = type !== 'all' && item.dataset.topicItem !== type;
      if (!item.hidden) visible++;
    }
    for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.topicFilter === type));
    list.hidden = visible === 0;
    empty.hidden = visible !== 0;
    emptyText.textContent = visible === 0 ? `此专题暂无${type === 'all' ? '内容' : type}` : '';
    status.textContent = type === 'all' ? `显示全部 ${visible} 项内容` : `${type} · ${visible} 项内容，保留原序号`;
  };
  for (const button of buttons) button.addEventListener('click', () => select(button.dataset.topicFilter ?? 'all'));
  root.querySelector<HTMLButtonElement>('[data-topic-filter-reset]')?.addEventListener('click', () => {
    select('all');
    buttons[0].focus();
  });
  select('all');
  bar.hidden = false;
}
