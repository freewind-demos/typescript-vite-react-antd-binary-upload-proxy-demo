/**
 * ★★★ 后端核心：收到 binary 上传后怎么处理 ★★★
 *
 * 看这个文件就够了。下面就是「收请求 → 读 body → 落盘」的全部逻辑。
 * 服务器监听、路由、health、404 等脚手架在 binary-upload-backend.ts，与这里无关。
 *
 * 前端约定（与 src/uploadBinary.ts 对应）：
 * - POST /api/upload-binary?fileName=xxx
 * - header content-type = 文件 MIME
 * - HTTP body = 文件原始二进制（不是 multipart / 不是 JSON）
 *
 * 日志策略：拿到什么立刻打，不攒成一份摘要再打印。
 */

import { createHash, randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { finished } from 'node:stream/promises';
import type { IncomingMessage } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';

/**
 * ★ 核心处理函数：边收边打日志
 */
export async function handleUploadBinary(req: IncomingMessage): Promise<void> {
  // 约定：前端会带 url，且 query 里有 fileName
  const url = new URL(req.url!, 'http://127.0.0.1');
  const fileName = url.searchParams.get('fileName')!;

  // 一拿到就打：method / path / query / headers
  console.log('[binary-upload] method:', req.method);
  console.log('[binary-upload] pathname:', url.pathname);
  console.log('[binary-upload] query:', Object.fromEntries(url.searchParams.entries()));
  console.log('[binary-upload] headers:', req.headers);
  console.log('[binary-upload] content-type:', req.headers['content-type']);

  const savedTempFilePath = path.join(
    tmpdir(),
    `binary-upload-proxy-demo-${Date.now()}-${randomUUID()}${path.extname(fileName)}`,
  );
  const fileStream = createWriteStream(savedTempFilePath);
  const sha256 = createHash('sha256');
  let totalBytes = 0;
  let first16BytesHex: string | null = null;

  // ★ body 按 chunk 到达：立刻打印，并边写盘边算 hash
  await new Promise<void>((resolve, reject) => {
    req.on('data', (chunk) => {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      totalBytes += buffer.length;
      sha256.update(buffer);
      fileStream.write(buffer);

      if (first16BytesHex === null) {
        first16BytesHex = buffer.subarray(0, 16).toString('hex');
        console.log('[binary-upload] body first16BytesHex:', first16BytesHex);
      }

      console.log('[binary-upload] body chunk bytes:', buffer.length, '| total:', totalBytes);
    });

    req.on('end', () => {
      fileStream.end();
      resolve();
    });

    req.on('error', reject);
    fileStream.on('error', reject);
  });

  await finished(fileStream);

  console.log('[binary-upload] body done bytes:', totalBytes);
  console.log('[binary-upload] body sha256:', sha256.digest('hex'));
  console.log('[binary-upload] savedTempFilePath:', savedTempFilePath);
}
