// One command starts the UI and our own GPU component; no endpoint/key input.
import '../scripts/sites-env.mjs';
import { spawn, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Miniflare, Log, LogLevel } from 'miniflare';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const windows = process.platform === 'win32';
const python = process.env.CATVTON_PYTHON || join(root, '.sites-runtime', 'catvton-venv', windows ? 'Scripts/python.exe' : 'bin/python');
if (!existsSync(python) || !existsSync(join(root, '.sites-runtime/catvton-upstream/model/pipeline.py')))
  throw new Error('Set up the GPU environment first: see tryon/README.md.');
if (!existsSync(join(root, 'dist/server/index.js')))
  throw new Error('Build the app first: npm run build.');
const secret = randomBytes(32).toString('hex');
const gpu = spawn(python, ['-m', 'uvicorn', 'server:app', '--host', '127.0.0.1', '--port', '7861', '--no-access-log'], {
  cwd: join(root, 'tryon'), windowsHide: true, stdio: ['ignore', 'inherit', 'inherit'],
  env: { ...process.env, TRYON_API_KEY: secret, CATVTON_SOURCE: join(root, '.sites-runtime/catvton-upstream'),
    HF_HOME: join(root, '.sites-runtime/catvton-cache'), PYTHONIOENCODING: 'utf-8', OMP_NUM_THREADS: '4' },
});
let mf;
let stopping = false;
async function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  if (gpu.pid && gpu.exitCode === null) {
    if (windows) spawnSync('taskkill', ['/pid', String(gpu.pid), '/t', '/f'], { windowsHide: true, stdio: 'ignore' });
    else gpu.kill('SIGTERM');
  }
  if (mf) await mf.dispose();
  process.exitCode = code;
}
gpu.on('error', error => { console.error('Could not start the GPU component:', error.message); void stop(1); });
gpu.on('exit', code => { if (!stopping) { console.error('GPU component stopped.'); void stop(code || 1); } });
process.on('SIGINT', () => void stop());
process.on('SIGTERM', () => void stop());
const modules = dir => readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  const path = join(dir, entry.name);
  return entry.isDirectory() ? modules(path) : /\.(?:js|mjs)$/.test(path) ? [{ type: 'ESModule', path }] : [];
});
try {
  mf = new Miniflare({
    name: 'vietphuc-local', host: '127.0.0.1', port: 5174, log: new Log(LogLevel.ERROR),
    modules: [{ type: 'ESModule', path: join(root, 'tryon/local-worker.mjs') }, ...modules(join(root, 'dist/server'))],
    compatibilityDate: '2026-05-15', compatibilityFlags: ['nodejs_compat'],
    bindings: { TRYON_API_URL: 'https://catvton.local.invalid', TRYON_API_KEY: secret },
    d1Databases: { DB: 'vietphuc-local' }, d1Persist: join(root, '.sites-runtime/local-data'),
    assets: { directory: join(root, 'dist/client'), binding: 'ASSETS',
      routerConfig: { has_user_worker: true, invoke_user_worker_ahead_of_assets: true } },
    outboundService: async request => {
      const url = new URL(request.url);
      if (url.hostname === 'catvton.local.invalid') { url.protocol = 'http:'; url.hostname = '127.0.0.1'; url.port = '7861'; }
      return fetch(url, { method: request.method, headers: request.headers, redirect: 'manual',
        body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer() });
    },
  });
  await mf.ready;
  const db = await mf.getD1Database('DB');
  await db.exec('CREATE TABLE IF NOT EXISTS local_migrations (name TEXT PRIMARY KEY)');
  for (const file of readdirSync(join(root, 'drizzle')).filter(f => f.endsWith('.sql')).sort()) {
    if (await db.prepare('SELECT name FROM local_migrations WHERE name = ?').bind(file).first()) continue;
    const statements = readFileSync(join(root, 'drizzle', file), 'utf8').split('--> statement-breakpoint').filter(s => s.trim());
    await db.batch([...statements.map(s => db.prepare(s)), db.prepare('INSERT INTO local_migrations(name) VALUES (?)').bind(file)]);
  }
  console.log('Viet phuc Remix: http://127.0.0.1:5174/?view=try-on');
  console.log('The model loads in the background. Click "Kiem tra lai" when ready. Ctrl+C stops both components.');
  console.log('Local edition: GPU/images stay on this computer; local data is separate from the hosted account.');
} catch (error) {
  console.error('Local app could not start:', error.message);
  await stop(1);
}
