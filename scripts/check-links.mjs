import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const outputRoot = resolve(fileURLToPath(new URL('../dist/', import.meta.url)));
const clientRoot = resolve(outputRoot, 'client');
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = createServer((request, response) => {
  const requestPath = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
  let relative = requestPath.replace(/^\/+/, '');
  const root =
    relative === 'pagefind' || relative.startsWith('pagefind/') ? outputRoot : clientRoot;
  let file = resolve(join(root, relative));
  if (!file.startsWith(root)) {
    response.writeHead(403).end();
    return;
  }

  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file) && !extname(file)) file = join(file, 'index.html');
  if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) {
    response.writeHead(404).end('Not found');
    return;
  }

  response.writeHead(200, {
    'Content-Type': contentTypes[extname(file)] ?? 'application/octet-stream',
  });
  createReadStream(file).pipe(response);
});

await new Promise((resolveServer) => server.listen(0, '127.0.0.1', resolveServer));
const address = server.address();
const port = typeof address === 'object' && address ? address.port : 0;
const command = process.execPath;
const args = [
  fileURLToPath(new URL('../node_modules/linkinator/build/src/cli.js', import.meta.url)),
  `http://127.0.0.1:${port}/`,
  '--recurse',
  '--clean-urls',
  '--check-fragments',
  '--skip',
  '^(https?://github.com|https?://static.cloudflareinsights.com|mailto:|https://wuwei-blog.1035945832.workers.dev/)',
];

const child = spawn(command, args, { stdio: 'inherit', shell: false });
const exitCode = await new Promise((resolveChild) => {
  child.on('error', () => resolveChild(1));
  child.on('exit', (code) => resolveChild(code ?? 1));
});

server.close();
process.exitCode = exitCode;
