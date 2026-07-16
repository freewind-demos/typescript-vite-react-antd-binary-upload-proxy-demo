/**
 * 后端脚手架：起 HTTP server、路由分发。
 *
 * 真正的「收到 binary 怎么处理」请看 → handleUploadBinary.ts
 */

import { once } from 'node:events';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createServer } from 'node:http';
import { handleUploadBinary } from './handleUploadBinary';

const backendPort = 43901;

type BinaryUploadBackend = {
  close: () => Promise<void>;
  port: number;
};

let backendPromise: Promise<BinaryUploadBackend> | null = null;

function sendJson(res: ServerResponse, statusCode: number, body: unknown) {
  const payload = JSON.stringify(body, null, 2);
  res.statusCode = statusCode;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(payload);
}

async function requestHandler(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url!, 'http://127.0.0.1');

  if (req.method === 'GET' && url.pathname === '/api/health') {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/upload-binary') {
    // ★ 核心逻辑在 handleUploadBinary.ts；这里只负责调用 + 打日志 + 回 ok
    const received = await handleUploadBinary(req);
    console.log('[binary-upload] received request:\n' + JSON.stringify(received, null, 2));
    sendJson(res, 200, { ok: true });
    return;
  }

  sendJson(res, 404, {
    message: 'not found',
    method: req.method,
    pathname: url.pathname,
  });
}

async function startBinaryUploadBackendServer(): Promise<BinaryUploadBackend> {
  const server = createServer((req, res) => {
    void requestHandler(req, res).catch((error) => {
      sendJson(res, 500, {
        message: error instanceof Error ? error.message : 'unknown server error',
      });
    });
  });

  server.listen(backendPort, '127.0.0.1');
  await once(server, 'listening');

  return {
    port: backendPort,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          backendPromise = null;
          resolve();
        });
      }),
  };
}

function ensureBinaryUploadBackendServer() {
  backendPromise ??= startBinaryUploadBackendServer();
  return backendPromise;
}

export { ensureBinaryUploadBackendServer };
