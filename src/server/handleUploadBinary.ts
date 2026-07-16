/**
 * ★★★ 后端核心：收到 binary 上传后怎么处理 ★★★
 *
 * 看这个文件就够了。下面就是「收请求 → 读 body → 落盘 → 打日志」的全部逻辑。
 * 服务器监听、路由、health、404 等脚手架在 binary-upload-backend.ts，与这里无关。
 *
 * 前端约定（与 src/uploadBinary.ts 对应）：
 * - POST /api/upload-binary?fileName=xxx
 * - header content-type = 文件 MIME
 * - HTTP body = 文件原始二进制（不是 multipart / 不是 JSON）
 */

import { createHash, randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import type { IncomingHttpHeaders, IncomingMessage } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';

/** 后端收到请求后整理出的摘要，用于终端日志 */
export type ReceivedBinaryUpload = {
  method: string;
  pathname: string;
  query: Record<string, string>;
  headers: Record<string, string | string[]>;
  savedTempFilePath: string;
  body: {
    bytes: number;
    sha256: string;
    first16BytesHex: string;
    first16BytesBase64: string;
    contentType: string;
  };
};

/** 把 Node IncomingMessage 的 body 读成完整 Buffer */
function readRawBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
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

function pickHeaders(headers: IncomingHttpHeaders) {
  const result: Record<string, string | string[]> = {};

  for (const [key, value] of Object.entries(headers)) {
    if (typeof value === 'undefined') {
      continue;
    }

    result[key] = value;
  }

  return result;
}

/**
 * ★ 核心处理函数
 *
 * 1. 从 query 取 fileName
 * 2. 把 HTTP body 当 raw binary 读完
 * 3. 写到系统临时目录（演示用，证明 body 真是文件内容）
 * 4. 返回摘要，由调用方 console.log 到终端
 */
export async function handleUploadBinary(req: IncomingMessage): Promise<ReceivedBinaryUpload> {
  const requestUrl = req.url ?? '/';
  const url = new URL(requestUrl, 'http://127.0.0.1');

  // ★ 步骤 1：读 query（前端放的 fileName）
  const fileName = url.searchParams.get('fileName') || 'upload.bin';

  // ★ 步骤 2：读 raw binary body（不是 JSON.parse，也不是 multer）
  const bodyBuffer = await readRawBody(req);

  // ★ 步骤 3：落盘，证明 body 就是文件字节
  const fileExtension = path.extname(fileName) || '.bin';
  const savedTempFilePath = path.join(
    tmpdir(),
    `binary-upload-proxy-demo-${Date.now()}-${randomUUID()}${fileExtension}`,
  );
  await writeFile(savedTempFilePath, bodyBuffer);

  // ★ 步骤 4：整理「后端实际收到了什么」，给终端打印
  return {
    method: req.method ?? 'UNKNOWN',
    pathname: url.pathname,
    query: Object.fromEntries(url.searchParams.entries()),
    headers: pickHeaders(req.headers),
    savedTempFilePath,
    body: {
      bytes: bodyBuffer.length,
      sha256: createHash('sha256').update(bodyBuffer).digest('hex'),
      first16BytesHex: bodyBuffer.subarray(0, 16).toString('hex'),
      first16BytesBase64: bodyBuffer.subarray(0, 16).toString('base64'),
      contentType: req.headers['content-type'] || 'application/octet-stream',
    },
  };
}
