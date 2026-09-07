export const siteMeta = {
  name: 'InkBrain',
  title: 'InkBrain — 可验证的技术路径',
  description: '关于 AI 应用架构、后端工程、Framework Labs 与开发者工具的个人技术出版物。',
  author: 'InkBrain',
};

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
    label: '知识地图',
    id: 'KNOWLEDGE',
    href: '/knowledge/',
    description: '按领域与关系浏览，而非只看时间线。',
  },
  {
    label: 'Framework Labs',
    id: 'LABS',
    href: '/frameworks/',
    description: '比较框架边界，明确实验与运行状态。',
  },
  {
    label: '开发者工具',
    id: 'TOOLS',
    href: '/tools/',
    description: '面向日常工程任务的精确工作面。',
  },
] as const;

export const maturityLabels = {
  idea: '构思',
  studied: '已学习',
  implemented: '已实现',
  verified: '已验证',
  production: '生产证据',
} as const;
