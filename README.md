# typescript-vite-react-antd-binary-upload-proxy-demo

最小 binary 上传 demo：

- 前端：Vite + React + Antd
- 后端：Node `http` server
- 反代：Vite `server.proxy`
- 上传方式：`POST /api/upload-binary`
- body：文件原始 binary
- 最小参数：query `fileName` + header `content-type`

## 快速开始

### 环境要求

- Node.js
- pnpm

### 运行

```bash
cd /Users/peng.li/workspace/freewind-demos/typescript-vite-react-antd-binary-upload-proxy-demo
pnpm install
pnpm dev
```

打开 `http://localhost:5173`，选文件后会自动上传。

## 重点只看这两个文件

其它文件都是页面壳 / 起服务 / 反代脚手架，可以先忽略。

1. **前端怎么发请求** → [`src/uploadBinary.ts`](src/uploadBinary.ts)
   - `buildUploadRequest`：拼 URL / header
   - `uploadBinary`：`fetch` 把 `File` 当 raw binary body POST 出去

2. **后端收到之后怎么处理** → [`src/server/handleUploadBinary.ts`](src/server/handleUploadBinary.ts)
   - 读到 `query` / `headers` 立刻打印
   - body 每个 chunk 到达立刻打印字节数
   - 写到临时文件，再打印总字节、sha256、落盘路径

## 页面里重点看什么

- `前端将发送的 req 参数`

后端收到的参数会打印在跑 `pnpm dev` 的终端里，例如：

- `method` / `pathname` / `query` / `headers`
- 每个 `body chunk bytes`
- `body done bytes` / `body sha256` / `savedTempFilePath`

所以你能直接在终端看清：

- 文件名放在 query 的什么位置
- `content-type` 怎么传
- raw binary body 本身不在 JSON 字段里，而在 HTTP body

## 教程

1. 打开 `src/uploadBinary.ts`，看前端如何用 `fetch` 发 raw binary。
2. 打开 `src/server/handleUploadBinary.ts`，看后端如何边收边打日志并落盘。
3. 跑 `pnpm dev`，选一个文件，对照页面上的 req 预览和终端里逐条打印的日志。
