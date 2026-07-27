export const SITE = {
  name: '五味书房',
  nameEn: 'Wuwei’s Digital Study',
  author: '五味',
  description: '一个关于嵌入式系统、边缘 AI、项目档案与随笔的开源数字书房。记录工程，也记录成长。',
  manifesto:
    '我喜欢把复杂的系统拆开，慢慢做成可靠的东西；也把一路上的试错、学习和灵感，留在这间数字书房里。',
  github: import.meta.env.PUBLIC_GITHUB_URL ?? 'https://github.com/lvyongjie-hub',
  repository: 'https://github.com/lvyongjie-hub/wuwei-blog',
  email: import.meta.env.PUBLIC_CONTACT_EMAIL ?? '',
} as const;

export const CONTENT_TYPE = {
  project: '项目档案',
  study: '书房文章',
  experiment: '实验记录',
  note: '随笔',
} as const;

export const NAV_ITEMS = [
  { href: '/study/', label: '书房', labelEn: 'STUDY' },
  { href: '/projects/', label: '项目档案', labelEn: 'PROJECTS' },
  { href: '/notes/', label: '随笔', labelEn: 'NOTES' },
  { href: '/about/', label: '关于', labelEn: 'ABOUT' },
] as const;

export const PROJECT_STATUS = {
  exploring: '探索中',
  active: '进行中',
  released: '已发布',
  archived: '已归档',
} as const;

export const BOOK_STATUS = {
  planning: '构思中',
  writing: '编写中',
  established: '已成体系',
} as const;

export const EXPERIMENT_STATUS = {
  idea: '灵感',
  running: '实验中',
  concluded: '已结论',
} as const;

export function formatDate(date: Date, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(date);
}
