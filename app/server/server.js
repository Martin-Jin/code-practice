// Local server: serves the built app, and runs C++ with the local g++ for the "local" runner.
//   npm run serve         http://localhost:5270   (PORT=... to change)
// It is a thin compile service: the browser builds the program and reads the results, so
// this file knows nothing about questions beyond catalog.json.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCatalog } from './catalog.js';
import { runLocal, gppVersion, MAX_SOURCE, MINGW_BIN } from './local-run.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(HERE, '..', 'dist');
const PORT = Number(process.env.PORT) || 5270;
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
  '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.map': 'application/json',
};

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

const send = (res, status, body, type = 'application/json') => {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(type === 'application/json' ? JSON.stringify(body) : body);
};

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_SOURCE + 1024) { reject(new HttpError(413, 'Request too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch { reject(new HttpError(400, 'Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

// The server compiles and runs code, so only accept requests meant for this page. That
// blocks other websites from POSTing to it, and DNS-rebinding tricks.
function sameOrigin(req) {
  const allowed = [`localhost:${PORT}`, `127.0.0.1:${PORT}`, `[::1]:${PORT}`];
  if (!allowed.includes(req.headers.host)) return false;
  const origin = req.headers.origin;
  return !origin || allowed.some((h) => origin === `http://${h}`);
}

function serveStatic(res, rel) {
  const file = path.resolve(DIST, rel);
  if (file !== DIST && !file.startsWith(DIST + path.sep)) return send(res, 403, 'Forbidden', 'text/plain');
  fs.readFile(file, (err, data) => {
    if (err) return send(res, 404, 'Not found', 'text/plain');
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    if (!sameOrigin(req)) return send(res, 403, 'Forbidden', 'text/plain');
    const { pathname } = new URL(req.url, 'http://localhost');

    // Rebuilt on every request, so editing a question file only needs a page refresh.
    if (pathname === '/catalog.json') return send(res, 200, buildCatalog());
    if (pathname === '/api/info' && req.method === 'GET') {
      return send(res, 200, { runner: 'local', compiler: await gppVersion() });
    }
    if (pathname === '/api/execute' && req.method === 'POST') {
      const body = await readJson(req);
      if (typeof body.source !== 'string' || !body.source) throw new HttpError(400, 'source must be a non-empty string');
      if (body.source.length > MAX_SOURCE) throw new HttpError(413, 'That program is too large');
      return send(res, 200, await runLocal(body.source));
    }
    if (pathname.startsWith('/api/')) throw new HttpError(404, 'No such API route');

    if (!fs.existsSync(DIST)) {
      return send(res, 503, 'The app is not built yet. Run "npm run build" in the app folder.', 'text/plain');
    }
    return serveStatic(res, pathname === '/' ? 'index.html' : decodeURIComponent(pathname.slice(1)));
  } catch (e) {
    if (!(e instanceof HttpError)) console.error(e);
    send(res, e.status || 500, { error: e.message || 'Server error' });
  }
});

if (!fs.existsSync(MINGW_BIN)) console.warn(`MinGW folder not found at ${MINGW_BIN}. Set MINGW_BIN, or make sure g++ is on PATH.`);
server.listen(PORT, '127.0.0.1', () => console.log(`Code practice running at http://localhost:${PORT}`));
