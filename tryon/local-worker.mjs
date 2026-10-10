// Local desktop adapter only. The hosted Worker keeps ChatGPT authentication.
import worker from '../dist/server/index.js';
export default {
  async fetch(request, env, context) {
    if (request.method === 'GET' || request.method === 'HEAD') {
      const asset = await env.ASSETS.fetch(request);
      if (asset.status !== 404) return asset;
    }
    const headers = new Headers(request.headers);
    headers.set('oai-authenticated-user-id', 'local-catvton-owner');
    headers.set('oai-authenticated-user-email', 'owner@localhost.invalid');
    return worker.fetch(new Request(request, { headers }), env, context);
  },
};
