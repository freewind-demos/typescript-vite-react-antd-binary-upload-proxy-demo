/**
 * ★★★ 前端核心：怎么发 binary 上传请求 ★★★
 *
 * 看这个文件就够了。下面就是全部请求逻辑，没有 UI。
 *
 * 约定：
 * - method: POST
 * - url:    /api/upload-binary?fileName=原始文件名
 * - header: content-type = 文件 MIME（没有就用 application/octet-stream）
 * - body:   File 对象本身（浏览器会按 raw binary 发出去，不是 FormData）
 */

/** 根据本地 File 拼出即将发出的请求参数（方便页面预览） */
export function buildUploadRequest(file: File) {
  // 没有 MIME 时兜底成通用二进制类型
  const contentType = file.type || 'application/octet-stream';
  // 最小业务参数只放在 query：文件名
  const query = new URLSearchParams({ fileName: file.name });

  return {
    method: 'POST' as const,
    url: `/api/upload-binary?${query.toString()}`,
    headers: {
      'content-type': contentType,
    },
    // body 不是 JSON，而是原始文件二进制
    body: file,
  };
}

/** 真正发出请求：把 File 当 raw binary body POST 出去 */
export async function uploadBinary(file: File): Promise<void> {
  const request = buildUploadRequest(file);

  const response = await fetch(request.url, {
    method: request.method,
    headers: request.headers,
    // ★ 关键：body 直接传 File，不是 FormData，也不是 JSON
    body: request.body,
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(responseText || `upload failed with ${response.status}`);
  }
}
