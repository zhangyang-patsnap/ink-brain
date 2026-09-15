import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'strict',
  theme: 'neutral',
  htmlLabels: false,
  flowchart: { htmlLabels: false, useMaxWidth: false },
});
let sequence = 0;
const rendering = new WeakSet();

function openDiagram(image, trigger) {
  const dialog = document.createElement('dialog');
  dialog.className = 'diagram-viewer';
  dialog.setAttribute('aria-label', '图表预览');
  dialog.style.cssText = 'position:fixed;inset:0;margin:0;width:100%;max-width:none;height:100vh;height:100dvh;max-height:none;box-sizing:border-box;padding:0;border:0;border-radius:0;background:var(--paper,#fff);color:var(--ink,#222);overflow:hidden;';

  const toolbar = document.createElement('div');
  toolbar.style.cssText = 'height:48px;box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;padding:0 12px 0 16px;border-bottom:1px solid #8885;font:14px/1.5 sans-serif;';
  const label = document.createElement('span');
  label.textContent = '图表预览';
  const close = document.createElement('button');
  close.type = 'button';
  close.textContent = '×';
  close.setAttribute('aria-label', '关闭图表预览');
  close.style.cssText = 'display:grid;place-items:center;width:44px;height:44px;padding:0;border:0;border-radius:4px;background:transparent;color:inherit;font:28px/1 sans-serif;cursor:pointer;';
  toolbar.append(label, close);

  const viewport = document.createElement('div');
  viewport.style.cssText = 'overflow:auto;overscroll-behavior:contain;height:calc(100% - 48px);';
  viewport.tabIndex = 0;
  viewport.setAttribute('role', 'region');
  viewport.setAttribute('aria-label', '放大的图表，可滚动查看');
  const enlarged = image.cloneNode(true);
  enlarged.style.cssText = 'display:block;width:100%;max-width:none;height:auto;margin:0;';
  viewport.append(enlarged);
  dialog.append(toolbar, viewport);

  const previousOverflow = document.documentElement.style.overflow;
  document.body.append(dialog);
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    document.documentElement.style.overflow = previousOverflow;
    dialog.remove();
    if (trigger.isConnected) trigger.focus({ preventScroll: true });
  }, { once: true });
  dialog.showModal();
  document.documentElement.style.overflow = 'hidden';
  close.focus({ preventScroll: true });
}

/** @param {Document | Element} [root] */
export async function renderDiagrams(root = document) {
  for (const code of root.querySelectorAll('code.language-mermaid')) {
    if (rendering.has(code)) continue;
    rendering.add(code);
    const source = code.textContent;
    try {
      const { svg } = await mermaid.render(`inkbrain-diagram-${++sequence}`, source);
      const figure = document.createElement('figure');
      figure.className = 'mermaid-diagram';
      figure.style.overflowX = 'auto';
      figure.style.margin = '16px 0';
      // A standalone SVG keeps marker references independent of the page hash
      // and prevents editor styles from overriding diagram text and edges.
      const documentSvg = new DOMParser().parseFromString(svg, 'image/svg+xml');
      const element = documentSvg.documentElement;
      const viewBox = element.getAttribute('viewBox')?.split(/[ ,]+/).map(Number);
      const image = document.createElement('img');
      image.alt = 'Mermaid 图表';
      if (viewBox?.length === 4 && viewBox[2] > 0 && viewBox[3] > 0) {
        element.setAttribute('width', String(viewBox[2]));
        element.setAttribute('height', String(viewBox[3]));
        image.width = Math.ceil(viewBox[2]);
        image.height = Math.ceil(viewBox[3]);
      }
      image.style.maxWidth = '100%';
      image.style.height = 'auto';
      image.style.display = 'block';
      image.style.margin = '0 auto';
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(element))}`;
      const expand = document.createElement('button');
      expand.type = 'button';
      expand.className = 'diagram-expand';
      expand.setAttribute('aria-label', '放大图表');
      expand.setAttribute('aria-haspopup', 'dialog');
      expand.style.cssText = 'display:block;width:100%;padding:0;margin:0;border:0;border-radius:0;background:transparent;color:inherit;cursor:zoom-in;';
      expand.addEventListener('click', () => openDiagram(image, expand));
      expand.append(image);
      figure.append(expand);
      code.parentElement.replaceWith(figure);
    } catch {
      code.setAttribute('title', 'Mermaid 语法错误，请检查图表源码');
    } finally {
      rendering.delete(code);
    }
  }
}
