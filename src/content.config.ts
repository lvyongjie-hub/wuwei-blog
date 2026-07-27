import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const commonFields = {
  title: z.string(),
  titleEn: z.string().optional(),
  description: z.string(),
  publishedAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
};

const books = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/books' }),
  schema: z.object({
    title: z.string(),
    titleEn: z.string().optional(),
    description: z.string(),
    status: z.enum(['planning', 'writing', 'established']),
    accent: z.string(),
    order: z.number().int().default(0),
    updatedAt: z.coerce.date().optional(),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: z.object({
    ...commonFields,
    status: z.enum(['exploring', 'active', 'released', 'archived']),
    featured: z.boolean().default(false),
    year: z.number().int(),
    role: z.string(),
    stack: z.array(z.string()),
    verification: z.array(z.string()).default([]),
    pendingVerification: z.array(z.string()).default([]),
    sourceUrl: z.url().optional(),
    demoUrl: z.url().optional(),
  }),
});

const study = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/study' }),
  schema: z.object({
    ...commonFields,
    book: z.string(),
    chapter: z.string(),
    order: z.number().int().default(0),
    lifecycle: z.enum(['current', 'partly-outdated', 'archived']).default('current'),
    appliesTo: z.array(z.string()).default([]),
  }),
});

const notes = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/notes' }),
  schema: z.object({
    ...commonFields,
    kind: z.enum(['short', 'long']),
  }),
});

const experiments = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/experiments' }),
  schema: z.object({
    ...commonFields,
    status: z.enum(['idea', 'running', 'concluded']),
    relatedProject: z.string().optional(),
    relatedBook: z.string().optional(),
  }),
});

export const collections = { books, projects, study, notes, experiments };
