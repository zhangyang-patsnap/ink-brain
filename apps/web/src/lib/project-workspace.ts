import { renderDiagrams, enableImageZoom } from './mermaid-client.js';

const workspace = document.querySelector<HTMLElement>('.project-workspace');
if (workspace) {
  const display = workspace.querySelector<HTMLElement>('#project-display');
  const picker = workspace.querySelector<HTMLDetailsElement>('.project-picker');
  const links = [...workspace.querySelectorAll<HTMLAnchorElement>('[data-project-select]')];
  const templates = new Map([...workspace.querySelectorAll<HTMLTemplateElement>('[data-project-template]')].map(template => [template.dataset.projectTemplate!, template]));
  const filters = workspace.querySelector<HTMLElement>('.project-type-filters');
  const filterButtons = [...workspace.querySelectorAll<HTMLButtonElement>('.project-type-filters button')];
  const cards = [...workspace.querySelectorAll<HTMLElement>('[data-project-category]')];
  const status = workspace.querySelector<HTMLElement>('.project-workspace-status');
  const compact = window.matchMedia('(max-width: 900px)');
  let current = links[0]?.dataset.projectSelect;

  if (display && picker && current) {
    const syncPicker = () => { if (!compact.matches) picker.open = true; };
    syncPicker();
    compact.addEventListener('change', syncPicker);
    if (filters) filters.hidden = false;

    const selectionURL = (slug: string) => {
      const url = new URL(window.location.href);
      url.searchParams.set('project', slug);
      url.hash = '';
      return url;
    };
    links.forEach(link => { link.href = selectionURL(link.dataset.projectSelect!).href; });

    function show(slug: string, { navigate = false, focus = false, replace = false } = {}) {
      const template = templates.get(slug);
      if (!template || !display || !picker) return;
      if (slug !== current) {
        display.replaceChildren(template.content.cloneNode(true));
        current = slug;
      }
      links.forEach(link => {
        if (link.dataset.projectSelect === slug) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
      const selected = workspace?.querySelector('[data-current-project]');
      if (selected) selected.textContent = template.dataset.projectName ?? '';
      if (navigate) history[replace ? 'replaceState' : 'pushState'](null, '', selectionURL(slug));
      if (compact.matches && focus) picker.open = false;
      if (focus) {
        display.querySelector<HTMLElement>('#project-title')?.focus({ preventScroll: true });
        display.scrollIntoView({ block: 'start', behavior: 'instant' });
      }
      if (status) status.textContent = `当前项目：${template.dataset.projectName}`;
      void renderDiagrams(display);
      enableImageZoom(display);
      document.dispatchEvent(new Event('project:changed'));
    }

    links.forEach(link => link.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      show(link.dataset.projectSelect!, { navigate: link.dataset.projectSelect !== current, focus: true });
    }));

    function filterCards(type = '') {
      let visible = 0;
      cards.forEach(card => {
        card.hidden = Boolean(type && card.dataset.projectCategory !== type);
        card.classList.toggle('project-exhibit-lead', !card.hidden && visible === 0);
        if (!card.hidden) visible++;
      });
      filterButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.projectType === type)));
      const quote = workspace?.querySelector<HTMLElement>('.project-exhibit-quote');
      if (quote) quote.hidden = visible < 2 || visible % 2 !== 0;
      return links.filter(link => !link.closest<HTMLElement>('[data-project-category]')?.hidden);
    }
    filterButtons.forEach(button => button.addEventListener('click', () => {
      const visible = filterCards(button.dataset.projectType);
      if (!visible.some(link => link.dataset.projectSelect === current) && visible[0]) {
        show(visible[0].dataset.projectSelect!, { navigate: true, replace: true });
      }
      picker.open = true;
      if (status) status.textContent = `${visible.length} 项作品，当前项目：${templates.get(current!)?.dataset.projectName}`;
    }));

    const restore = () => {
      filterCards();
      const requested = new URL(window.location.href).searchParams.get('project');
      const slug = requested && templates.has(requested) ? requested : links[0].dataset.projectSelect!;
      show(slug);
      if (requested && !templates.has(requested)) history.replaceState(null, '', selectionURL(slug));
      if (window.location.hash) {
        try { display.querySelector<HTMLElement>(`[id="${CSS.escape(decodeURIComponent(window.location.hash.slice(1)))}"]`)?.scrollIntoView(); }
        catch { /* An invalid fragment must not break project selection. */ }
      }
    };
    restore();
    window.addEventListener('popstate', restore);
  }
}
