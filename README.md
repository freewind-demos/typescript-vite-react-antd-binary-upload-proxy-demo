# typescript-vite-react-antd-binary-upload-proxy-demo

最小 binary 上传 demo：

- 前端：Vite + React + Antd
- 后端：Node `http` server
- 反代：Vite `server.proxy`
- 上传方式：`POST /api/upload-binary`
- body：文件原始 binary
- 最小参数：query `fileName` + header `content-type`

## 运行

```bash
cd /Users/peng.li/workspace/freewind-demos/typescript-vite-react-antd-binary-upload-proxy-demo
pnpm install
pnpm dev
```

打开 `http://localhost:5173`，选文件后会自动上传。

## 页面里重点看什么

- `前端将发送的 req 参数`

后端收到的参数**不回前台**，而是打印在跑 `pnpm dev` 的终端控制台，例如：

- `query`
- `headers`
- `body.bytes`
- `body.sha256`
- `body.first16BytesHex`
- `savedTempFilePath`

所以你能直接在终端看清：

- 文件名放在 query 的什么位置
- `content-type` 怎么传
- raw binary body 本身不在 JSON 字段里，而在 HTTP body
