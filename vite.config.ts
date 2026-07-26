import { defineConfig } from 'vite';
import type { ViteDevServer } from 'vite';

// ─── In-memory ranking store (development mock) ────────────────────────────────

interface RankingRecord {
  alias: string;
  level: number;
  vitaScore: number;
  precision: number;
  variety: number;
  createdAt: string;
}

const rankings: RankingRecord[] = [];

function rankingApiPlugin() {
  return {
    name: 'ranking-api-mock',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/rankings', (req, res) => {
        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
          req.on('end', () => {
            try {
              const entry = JSON.parse(body);
              const record: RankingRecord = {
                alias: String(entry.alias || '').slice(0, 16),
                level: Number(entry.level) || 1,
                vitaScore: Number(entry.vitaScore) || 0,
                precision: Number(entry.precision) || 0,
                variety: Number(entry.variety) || 0,
                createdAt: new Date().toISOString(),
              };
              rankings.push(record);
              console.log(`[ranking-mock] Score submitted: ${record.alias} — VitaScore ${record.vitaScore} (Level ${record.level})`);
              res.statusCode = 201;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ message: 'Score submitted' }));
            } catch {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
          });
          return;
        }

        if (req.method === 'GET') {
          const url = new URL(req.url || '/', `http://${req.headers.host}`);
          const level = Number(url.searchParams.get('level')) || 1;
          const limit = Number(url.searchParams.get('limit')) || 10;

          const filtered = rankings
            .filter((r) => r.level === level)
            .sort((a, b) => b.vitaScore - a.vitaScore)
            .slice(0, limit);

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(filtered));
          return;
        }

        res.statusCode = 405;
        res.end(JSON.stringify({ error: 'Method not allowed' }));
      });
    },
  };
}

// ─── Vite Config ────────────────────────────────────────────────────────────────

export default defineConfig({
  base: './',
  plugins: [rankingApiPlugin()],
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 3000,
    open: true,
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
