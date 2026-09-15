import settings from './settings.json';
export const siteMeta = settings;

export const siteStats = {
  totalVisits: {
    label: '累计访问',
    value: '12,846',
    status: 'DEMO',
  },
} as const;

export const destinations = [
  {
    label: '技术写作',
    id: 'WRITING',
    href: '/writing/',
    description: '从原理到实现，记录完整工程问题。',
  },
  {
    label: '知识专题',
    id: 'KNOWLEDGE',
    href: '/knowledge/',
    description: '从主题、概念与学习路径进入知识。',
  },
  {
    label: '项目作品',
    id: 'PROJECTS',
    href: '/projects/',
    description: '了解自研框架、应用与库的设计和进展。',
  },
  {
    label: '工具市场',
    id: 'TOOLS',
    href: '/tools/',
    description: '获取 macOS 应用、CLI、插件与在线小工具。',
  },
] as const;

export const maturityLabels = {
  idea: '构思',
  studied: '已学习',
  implemented: '已实现',
  verified: '已验证',
  production: '生产证据',
} as const;

export const homeMeta = {
  eyebrow: 'ENGINEERED FOR CLARITY',
  authorRole: 'Senior Backend Engineer',
  statement: {
    quote: '记录一条技术的来路，比记住结论更有用。',
    cite: 'THE PATH, NOT THE ANSWER.',
  },
} as const;
