// Static review data only. No admin APIs or content writes.
const articles = [
  {title:'测试',summary:'测试',date:'2026-09-09',topic:'Agent 工程',minutes:5,url:'http://127.0.0.1:4332/writing/article-20260909-048fde9c/'},
  {title:'AI 应用开发的四种架构范式',summary:'在动手写代码之前，建立一套属于 AI 时代的架构思维体系。',date:'2026-09-08',topic:'AI 架构',minutes:5,url:'http://127.0.0.1:4332/writing/article-20260908-64c386d8/'},
  {title:'构建可演化的 AI 应用架构',summary:'从边界、契约与失败路径出发，为会持续变化的 AI 系统保留可验证性。',date:'2026-08-28',topic:'AI 架构',minutes:12,url:'http://127.0.0.1:4331/writing/designing-verifiable-ai-systems/'},
  {title:'Rust Agent Runtime 的边界设计',summary:'用类型、事件和所有权语言描述一个最小智能体运行时应承担什么。',date:'2026-08-16',topic:'运行时',minutes:9,url:'http://127.0.0.1:4332/writing/rust-runtime-boundaries/'},
  {title:'用类型约束 Agent 与工具的协作',summary:'让工具输入、模型输出和失败反馈都成为可检查的工程契约。',date:'2026-08-04',topic:'Agent 工程',minutes:10,url:'http://127.0.0.1:4331/writing/typed-agent-contracts/'},
];
const notes = {b:'保留方案：一篇选读 + 双列文章，平衡重点推荐与日常浏览。',d:'新方案：杂志式刊头、非对称封面与三列短文。封面为可自动生成的几何插画，无需每篇配图。',e:'新方案：以技术方向组织展区，大字展签与文章组合形成节奏。按标签分组，不增加后台专题维护。'};
const root=document.documentElement;
const valid=new URLSearchParams(location.search).get('layout');
if(['b','d','e'].includes(valid))root.dataset.layout=valid;
let category='全部';
const meta=a=>`<div class="meta"><span class="topic">${a.topic}</span><time datetime="${a.date}">${a.date.replaceAll('-',' / ')}</time><span>${a.minutes} 分钟阅读</span></div>`;
const row=a=>`<article class="entry"><div class="entry-content">${meta(a)}<h2><a href="${a.url}">${a.title}</a></h2><p>${a.summary}</p></div><a class="read" href="${a.url}" aria-label="阅读：${a.title}">阅读<span aria-hidden="true">↗</span></a></article>`;
// Decorative cover art, not an architecture diagram or a claim about implementation.
const coverArt=`<svg class="cover-art" viewBox="0 0 520 360" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1"><path d="M28 30H492V330H28Z M28 180H492 M260 30V330" opacity=".3"/><path d="M52 54H238V156H52Z M282 204H468V306H282Z"/><circle cx="375" cy="105" r="62"/><circle cx="375" cy="105" r="39"/><circle cx="145" cy="255" r="62"/><path d="m83 255 62-62 62 62-62 62Z"/><path d="M70 80H220M70 105H220M70 130H220M300 230H450M300 255H450M300 280H450" opacity=".5"/></g><path d="M250 170h20v20h-20z" fill="currentColor"/><path d="m360 105 15-15 15 15-15 15Z" fill="currentColor"/><text x="36" y="352" fill="currentColor" stroke="none" font-family="monospace" font-size="10">FORM / STRUCTURE / POSSIBILITY</text></svg>`;
const directions={
 'AI 架构':{word:'架构',en:'ARCHITECTURE',description:'先看清结构，再开始构建。',className:'architecture'},
 'Agent 工程':{word:'协作',en:'AGENT ENGINEERING',description:'让模型、工具与系统可靠协作。',className:'agent'},
 '运行时':{word:'运行',en:'RUNTIME',description:'沿着事件，走进执行现场。',className:'runtime'},
};
const exhibitionRow=a=>`<article class="exhibit-entry"><div class="meta"><time datetime="${a.date}">${a.date.replaceAll('-',' / ')}</time><span>${a.minutes} 分钟阅读</span></div><h3><a href="${a.url}">${a.title}<span aria-hidden="true">↗</span></a></h3><p>${a.summary}</p></article>`;
function render(){
  const query=document.querySelector('#search').value.trim().toLowerCase();
  const list=articles.filter(a=>(category==='全部'||a.topic===category)&&`${a.title} ${a.summary}`.toLowerCase().includes(query));
  document.querySelector('#count').textContent=`${list.length} 篇文章 · ${root.dataset.layout==='e'?'按技术方向分组':'按时间排序'}`;
  document.querySelector('#empty').hidden=!!list.length;
  document.querySelector('.list-end').hidden=!list.length;
  const lead=['b','d'].includes(root.dataset.layout) ? (list.find(a=>a===articles[1])||list[0]) : null;
  document.querySelector('#spotlight').innerHTML=lead?`<article class="spotlight"><div><p class="eyebrow">本期选读 · 样稿</p><h2><a href="${lead.url}">${lead.title}</a></h2>${meta(lead)}</div><div class="lead-side"><p class="lead-summary">${lead.summary}</p><a href="${lead.url}">阅读这篇文章 ↗</a></div></article>`:'';
  document.querySelector('#articles').innerHTML=list.filter(a=>a!==lead).map(row).join('');
  if(root.dataset.layout==='d' && lead){
    document.querySelector('#spotlight').innerHTML=`<article class="cover-story"><div class="cover-copy"><p class="eyebrow">封面选读 / ${lead.topic}</p><h2><a href="${lead.url}">${lead.title}</a></h2><p class="cover-summary">${lead.summary}</p>${meta(lead)}<a class="cover-link" href="${lead.url}">进入这篇思考 <span aria-hidden="true">↗</span></a></div><div class="cover-visual">${coverArt}<span class="cover-caption">INKBRAIN / 技术写作</span></div></article><div class="more-heading"><h2>继续翻阅</h2><span>更多设计、实现与复盘</span></div>`;
  }
  if(root.dataset.layout==='e'){
    document.querySelector('#articles').innerHTML=Object.entries(directions).map(([topic,d])=>{
      const entries=list.filter(a=>a.topic===topic);if(!entries.length)return '';
      return `<section class="exhibit ${d.className}" aria-label="${topic}"><header class="exhibit-label"><span class="exhibit-en">${d.en}</span><h2>${d.word}<span aria-hidden="true">.</span></h2><p>${d.description}</p><span class="exhibit-count">${entries.length} 篇文章 / ${topic}</span></header><div class="exhibit-articles">${entries.map(exhibitionRow).join('')}</div></section>`;
    }).join('');
  }
}
for(const name of ['全部','AI 架构','Agent 工程','运行时']){
  const b=document.createElement('button');b.className='category';b.setAttribute('aria-pressed',String(name===category));b.innerHTML=`${name}<span>${name==='全部'?articles.length:articles.filter(a=>a.topic===name).length}</span>`;
  b.addEventListener('click',()=>{category=name;document.querySelectorAll('.category').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));render()});document.querySelector('#categories').append(b);
}
function syncLayout(){
  const spotlight=document.querySelector('#spotlight');
  if(root.dataset.layout==='d') document.querySelector('.page').insertBefore(spotlight,document.querySelector('.content-layout'));
  else document.querySelector('.listing').insertBefore(spotlight,document.querySelector('#articles'));
  document.querySelectorAll('.options button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.layout===root.dataset.layout)));
  document.querySelector('#design-note').textContent=notes[root.dataset.layout];
  const headings={b:'在实践中，理解技术。',d:'技术与思考',e:'从一个问题，走进一组思考。'};
  document.querySelector('.page-intro h1').textContent=headings[root.dataset.layout];
  if(root.dataset.layout==='e') document.querySelector('.page-intro h1').innerHTML='<span>从一个问题，</span><span>走进一组思考。</span>';
  document.querySelector('.page-intro .eyebrow').textContent=root.dataset.layout==='d'?'INKBRAIN JOURNAL / 技术写作':'技术写作';
  render();
}
document.querySelectorAll('.options button').forEach(b=>b.addEventListener('click',()=>{root.dataset.layout=b.dataset.layout;const u=new URL(location.href);u.searchParams.set('layout',b.dataset.layout);history.replaceState(null,'',u);syncLayout()}));
document.querySelector('#search').addEventListener('input',render);
document.querySelector('#reset').addEventListener('click',()=>{document.querySelector('#search').value='';document.querySelector('.category').click();document.querySelector('#search').focus()});
document.querySelector('#style-toggle').addEventListener('click',e=>{const work=root.dataset.style!=='workbench';root.dataset.style=work?'workbench':'paper';e.currentTarget.textContent=work?'阅读工作台 ⇄':'纸上 ⇄';e.currentTarget.setAttribute('aria-label',work?'当前阅读工作台，切换为纸上':'当前纸上，切换为阅读工作台')});
document.querySelector('#theme-toggle').addEventListener('click',e=>{const dark=root.dataset.theme!=='dark';root.dataset.theme=dark?'dark':'light';e.currentTarget.title=dark?'切换为浅色模式':'切换为深色模式';e.currentTarget.setAttribute('aria-label',e.currentTarget.title)});
syncLayout();
