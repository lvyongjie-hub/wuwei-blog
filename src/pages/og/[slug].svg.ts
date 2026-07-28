import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { SITE } from '@/lib/site';

interface OgProps {
  title: string;
  titleEn?: string;
  label: string;
}

const slugifyId = (id: string) => id.replaceAll('/', '-');

export const getStaticPaths = (async () => {
  const [projects, books, study, experiments, notes] = await Promise.all([
    getCollection('projects', ({ data }) => !data.draft),
    getCollection('books', ({ data }) => !data.draft),
    getCollection('study', ({ data }) => !data.draft),
    getCollection('experiments', ({ data }) => !data.draft),
    getCollection('notes', ({ data }) => !data.draft),
  ]);
  const publishedBookIds = new Set(books.map((book) => book.id));

  return [
    {
      params: { slug: 'default' },
      props: { title: SITE.name, titleEn: SITE.nameEn, label: 'ENGINEER’S DIGITAL STUDY' },
    },
    ...projects.map((entry) => ({
      params: { slug: `project-${slugifyId(entry.id)}` },
      props: { title: entry.data.title, titleEn: entry.data.titleEn, label: 'PROJECT ARCHIVE' },
    })),
    ...study
      .filter((entry) => publishedBookIds.has(entry.data.book))
      .map((entry) => ({
        params: { slug: `study-${slugifyId(entry.id)}` },
        props: { title: entry.data.title, titleEn: entry.data.titleEn, label: 'THE STUDY' },
      })),
    ...experiments.map((entry) => ({
      params: { slug: `experiment-${slugifyId(entry.id)}` },
      props: { title: entry.data.title, titleEn: entry.data.titleEn, label: 'LAB NOTEBOOK' },
    })),
    ...notes.map((entry) => ({
      params: { slug: `note-${slugifyId(entry.id)}` },
      props: { title: entry.data.title, titleEn: entry.data.titleEn, label: 'NOTES & MARGINALIA' },
    })),
  ];
}) satisfies GetStaticPaths;

const escapeXml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const wrapTitle = (title: string) => {
  const characters = Array.from(title);
  if (characters.length <= 16) return [title, ''];
  const first = characters.slice(0, 16).join('');
  const remaining = characters.slice(16);
  const second = remaining.length > 18 ? `${remaining.slice(0, 17).join('')}…` : remaining.join('');
  return [first, second];
};

export const GET: APIRoute = ({ props }) => {
  const { title, titleEn = '', label } = props as OgProps;
  const [lineOne, lineTwo] = wrapTitle(title);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${escapeXml(title)}">
      <rect width="1200" height="630" fill="#f3efe6"/>
      <path d="M0 0H1200V630H0Z" fill="url(#paper)" opacity=".38"/>
      <defs>
        <pattern id="paper" width="52" height="52" patternUnits="userSpaceOnUse">
          <path d="M0 51.5H52M51.5 0V52" stroke="#25241f" stroke-opacity=".035"/>
        </pattern>
      </defs>
      <rect x="72" y="66" width="1056" height="498" rx="30" fill="none" stroke="#25241f" stroke-opacity=".16"/>
      <path d="M72 164H1128" stroke="#25241f" stroke-opacity=".12"/>
      <text x="108" y="125" fill="#315747" font-family="JetBrains Mono, monospace" font-size="22" font-weight="650" letter-spacing="4">${escapeXml(label)}</text>
      <g transform="translate(944 91)">
        <rect width="118" height="118" rx="18" fill="#e8e0d2" stroke="#25241f" stroke-width="2"/>
        <path d="M13 82h20l8-20 11 34 11-27 8 13h34" fill="none" stroke="#b17a3d" stroke-width="3"/>
        <text x="59" y="58" text-anchor="middle" fill="#25241f" font-family="Noto Serif SC, serif" font-size="34" font-weight="650" letter-spacing="-4">五味</text>
      </g>
      <text x="108" y="286" fill="#25241f" font-family="Noto Serif SC, serif" font-size="64" font-weight="600" letter-spacing="-2">${escapeXml(lineOne)}</text>
      ${lineTwo ? `<text x="108" y="368" fill="#25241f" font-family="Noto Serif SC, serif" font-size="64" font-weight="600" letter-spacing="-2">${escapeXml(lineTwo)}</text>` : ''}
      ${titleEn ? `<text x="110" y="438" fill="#5d5a51" font-family="JetBrains Mono, monospace" font-size="23" letter-spacing="1.2">${escapeXml(titleEn.slice(0, 72))}</text>` : ''}
      <path d="M108 505H321" stroke="#b17a3d" stroke-width="5"/>
      <text x="108" y="540" fill="#5d5a51" font-family="Noto Sans SC, sans-serif" font-size="20">五味书房 · 记录工程，也记录成长</text>
      <path d="M829 518h52l16-28 18 45 17-32 13 15h75" fill="none" stroke="#315747" stroke-width="3" opacity=".7"/>
    </svg>`;

  return new Response(svg.trim(), {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
