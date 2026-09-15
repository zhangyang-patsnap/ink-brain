// One animation frame per scroll update, scoped to the currently mounted project.
let scheduled = false;
function updateDirectory() {
  scheduled = false;
  const sheet = document.querySelector('.project-sheet');
  if (!sheet) return;
  const links = [...sheet.querySelectorAll<HTMLAnchorElement>('.project-directory a')];
  const targets = [...new Set(links.map(link => link.hash.slice(1)))].map(id => document.getElementById(id)).filter((target): target is HTMLElement => Boolean(target));
  let current = targets[0]?.id;
  for (const target of targets) {
    if (target.getBoundingClientRect().top <= 140) current = target.id;
  }
  links.forEach(link => {
    if (link.hash === `#${current}`) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
function scheduleUpdate() {
  if (!scheduled) { scheduled = true; requestAnimationFrame(updateDirectory); }
}
window.addEventListener('scroll', scheduleUpdate, { passive: true });
window.addEventListener('resize', scheduleUpdate);
window.addEventListener('hashchange', scheduleUpdate);
document.addEventListener('project:changed', scheduleUpdate);
scheduleUpdate();
