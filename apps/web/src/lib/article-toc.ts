export function setupArticleToc() {
  const content = document.querySelector<HTMLElement>('.reader-body');
  const sidebar = document.querySelector<HTMLElement>('.reader-toc');
  const mobile = document.querySelector<HTMLDetailsElement>('.reader-mobile-toc');
  if (!content || !sidebar || !mobile) return;
  // Published articles contain sanitized HTML, so Astro's Markdown heading
  // metadata can be empty. Read the rendered headings in both content paths.
  const headings = [...content.querySelectorAll<HTMLElement>('h1,h2,h3')]
    .filter(heading => heading.textContent?.trim() && !heading.closest('blockquote'));
  if (!headings.length) return;
  const ids = new Set([...document.querySelectorAll('[id]')].map(node => node.id));
  const minimumLevel = Math.min(...headings.map(heading => Number(heading.tagName.slice(1))));
  headings.forEach((heading, index) => {
    if (!heading.id) {
      let id = `article-section-${index + 1}`;
      while (ids.has(id)) id += '-heading';
      heading.id = id;
      ids.add(id);
    }
    for (const nav of [sidebar.querySelector('nav'), mobile.querySelector('nav')]) {
      const link = document.createElement('a');
      link.href = `#${encodeURIComponent(heading.id)}`;
      link.textContent = heading.textContent!.trim();
      if (Number(heading.tagName.slice(1)) > minimumLevel) link.dataset.nested = '';
      nav?.append(link);
    }
  });
  sidebar.hidden = false;
  mobile.hidden = false;
  const links = [...sidebar.querySelectorAll('a')];
  const markCurrent = () => {
    const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
    const current = atBottom ? headings.at(-1)! : headings.filter(heading => heading.getBoundingClientRect().top <= 100).at(-1) ?? headings[0];
    links.forEach(link => {
      if (link.hash === `#${encodeURIComponent(current.id)}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };
  const observer = new IntersectionObserver(markCurrent, { rootMargin: '-28px 0px -65% 0px', threshold: [0, 1] });
  headings.forEach(heading => observer.observe(heading));
  // The final section may be too short to reach the top detection band.
  let frame = 0;
  document.addEventListener('scroll', () => {
    if (!frame) frame = requestAnimationFrame(() => { frame = 0; markCurrent(); });
  }, { passive: true });
  markCurrent();
  mobile.addEventListener('click', event => {
    const link = (event.target as Element).closest('a');
    if (!link) return;
    event.preventDefault();
    mobile.open = false;
    const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
    requestAnimationFrame(() => {
      history.replaceState(null, '', link.hash);
      target?.scrollIntoView({ block: 'start' });
    });
  });
  // Restore heading deep links when the publication supplied HTML without ids.
  if (location.hash) {
    try { document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView(); } catch { /* Ignore malformed fragments. */ }
  }
}
