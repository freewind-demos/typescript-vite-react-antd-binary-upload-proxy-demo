import { createHash } from 'node:crypto';
import { once } from 'node:events';
import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'node:http';
import { createServer } from 'node:http';

const backendPort = 43901;

type BinaryUploadBackend = {
  close: () => Promise<void>;
  port: number;
};

type BinaryUploadEchoResponse = {
  method: string;
  pathname: string;
  query: Record<string, string>;
  headers: Record<string, string | string[]>;
  body: {
    bytes: number;
    sha256: string;
    first16BytesHex: string;
    first16BytesBase64: string;
    contentType: string;
  };
};

let backendPromise: Promise<BinaryUploadBackend> | null = null;

function normalizeHeaders(headers: IncomingHttpHeaders) {
  const normalizedHeaders: Record<string, string | string[]> = {};

  for (const [key, value] of Object.entries(headers)) {
    if (typeof value === 'undefined') {
      continue;
    }

    normalizedHeaders[key] = value;
  }

  return normalizedHeaders;
}

function sendJson(res: ServerResponse, statusCode: number, body: unknown) {
  const payload = JSON.stringify(body, null, 2);
  res.statusCode = statusCode;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(payload);
}

function readRequestBody(req: IncomingMessage) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];

    req.on('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    req.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    req.on('error', reject);
  });
}

async function createEchoResponse(req: IncomingMessage): Promise<BinaryUploadEchoResponse> {
  const requestUrl = req.url ?? '/';
  const url = new URL(requestUrl, 'http://127.0.0.1');
  const bodyBuffer = await readRequestBody(req);

  return {
    method: req.method ?? 'UNKNOWN',
    pathname: url.pathname,
    query: Object.fromEntries(url.searchParams.entries()),
    headers: normalizeHeaders(req.headers),
    body: {
      bytes: bodyBuffer.length,
      sha256: createHash('sha256').update(bodyBuffer).digest('hex'),
      first16BytesHex: bodyBuffer.subarray(0, 16).toString('hex'),
      first16BytesBase64: bodyBuffer.subarray(0, 16).toString('base64'),
      contentType: req.headers['content-type'] || 'application/octet-stream',
    },
  };
}

async function requestHandler(req: IncomingMessage, res: ServerResponse) {
  const requestUrl = req.url ?? '/';
  const url = new URL(requestUrl, 'http://127.0.0.1');

  if (req.method === 'GET' && url.pathname === '/api/health') {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/upload-binary') {
    const echoResponse = await createEchoResponse(req);
    sendJson(res, 200, echoResponse);
    return;
  }

  sendJson(res, 404, {
    message: 'not found',
    method: req.method ?? 'UNKNOWN',
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
export type { BinaryUploadEchoResponse };
