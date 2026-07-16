# typescript-vite-react-antd-binary-upload-proxy-demo

最小 binary 上传 demo：

- 前端：Vite + React + Antd
- 后端：Node `http` server
- 反代：Vite `server.proxy`
- 上传方式：`POST /api/upload-binary`
- body：文件原始 binary
- metadata：放 query + headers

## 运行

```bash
cd /Users/peng.li/workspace/freewind-demos/typescript-vite-react-antd-binary-upload-proxy-demo
pnpm install
pnpm dev
```

打开 `http://localhost:5173`，选文件后会自动上传。

## 页面里重点看什么

- `前端将发送的 req 参数`
- `后端实际收到的参数`

后端会回显：

- `query`
- `headers`
- `body.bytes`
- `body.sha256`
- `body.first16BytesHex`

所以你能直接看清：

- 文件名、大小、mimeType 放在什么位置
- `content-type` 怎么传
- raw binary body 本身不在 JSON 字段里，而在 HTTP body
