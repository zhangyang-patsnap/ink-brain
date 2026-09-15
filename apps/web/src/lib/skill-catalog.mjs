export const skillCategories = [
  { value: 'development', label: '开发与调试' },
  { value: 'documents', label: '文档与报告' },
  { value: 'design', label: '设计与前端' },
  { value: 'data', label: '数据与分析' },
  { value: 'operations', label: '运维与观测' },
  { value: 'other', label: '其他能力' },
];
export const skillOrigins = { original: '自研', reference: '引用' };
export function sortSkills(skills) {
  return [...skills].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}
