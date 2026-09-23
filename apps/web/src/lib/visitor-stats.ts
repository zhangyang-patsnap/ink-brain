// 读取后台公开统计接口，回填页面上的访客数字。接口不存在或请求失败时静默放弃——
// 例如 INKBRAIN_SOURCE_PREVIEW=1 的纯源码预览模式没有后台，不应因此中断页面渲染。
const formatCount = (value: number) => value.toLocaleString('zh-CN');

export async function hydrateSiteTotal(): Promise<void> {
  const target = document.querySelector<HTMLElement>('[data-total-visitors]');
  if (!target) return;
  try {
    const response = await fetch('/api/stats/summary');
    if (!response.ok) return;
    const { totalVisitors } = await response.json();
    if (typeof totalVisitors === 'number') target.textContent = formatCount(totalVisitors);
  } catch {
    // 网络失败或接口不存在时保留占位内容，不影响其余页面。
  }
}

export async function hydrateArticleViews(): Promise<void> {
  const targets = document.querySelectorAll<HTMLElement>('[data-article-views]');
  if (targets.length === 0) return;
  const ids = [...new Set([...targets].map((el) => el.dataset.articleViews).filter((id): id is string => Boolean(id)))];
  try {
    const response = await fetch(`/api/stats/articles?ids=${ids.map(encodeURIComponent).join(',')}`);
    if (!response.ok) return;
    const counts: Record<string, number> = await response.json();
    for (const el of targets) {
      const id = el.dataset.articleViews;
      const count = id ? counts[id] : undefined;
      if (typeof count === 'number') el.textContent = `${formatCount(count)} 次阅读`;
    }
  } catch {
    // 同上：静默放弃，保留占位内容。
  }
}
