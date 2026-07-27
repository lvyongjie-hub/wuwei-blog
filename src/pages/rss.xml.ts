import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE } from '@/lib/site';

export const GET: APIRoute = async (context) => {
  const [projects, study, experiments, notes] = await Promise.all([
    getCollection('projects', ({ data }) => !data.draft),
    getCollection('study', ({ data }) => !data.draft),
    getCollection('experiments', ({ data }) => !data.draft),
    getCollection('notes', ({ data }) => !data.draft),
  ]);

  const items = [
    ...projects.map((entry) => ({
      title: entry.data.title,
      description: entry.data.description,
      pubDate: entry.data.updatedAt ?? entry.data.publishedAt,
      link: `/projects/${entry.id}/`,
      customData: '<category>项目档案</category>',
    })),
    ...study.map((entry) => ({
      title: entry.data.title,
      description: entry.data.description,
      pubDate: entry.data.updatedAt ?? entry.data.publishedAt,
      link: `/study/${entry.data.book}/${entry.id}/`,
      customData: '<category>书房文章</category>',
    })),
    ...experiments.map((entry) => ({
      title: entry.data.title,
      description: entry.data.description,
      pubDate: entry.data.updatedAt ?? entry.data.publishedAt,
      link: `/experiments/${entry.id}/`,
      customData: '<category>实验记录</category>',
    })),
    ...notes.map((entry) => ({
      title: entry.data.title,
      description: entry.data.description,
      pubDate: entry.data.updatedAt ?? entry.data.publishedAt,
      link: `/notes/${entry.id}/`,
      customData: '<category>随笔</category>',
    })),
  ].sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  return rss({
    title: `${SITE.name} · RSS`,
    description: SITE.description,
    site: context.site ?? 'https://wuwei-blog.pages.dev',
    items,
    customData: '<language>zh-CN</language>',
  });
};
