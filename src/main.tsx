/**
 * 页面壳：选文件、展示状态。
 *
 * 真正的「前端怎么发请求」请看 → uploadBinary.ts
 */

import React, { type ChangeEvent, type FC } from 'react';
import ReactDOM from 'react-dom/client';
import { Alert, Card, Layout, Space, Spin, Typography } from 'antd';
import { buildUploadRequest, uploadBinary } from './uploadBinary';

const { Content, Header } = Layout;

const formatJson = (value: unknown) => JSON.stringify(value, null, 2);

const JsonBlock: FC<{
  emptyText: string;
  value: unknown;
}> = ({ emptyText, value }) => (
  <Typography.Paragraph
    style={{
      fontFamily: 'monospace',
      marginBottom: 0,
      whiteSpace: 'pre-wrap',
    }}
  >
    {value === null ? emptyText : formatJson(value)}
  </Typography.Paragraph>
);

const App: FC = () => {
  const [selectedFileLabel, setSelectedFileLabel] = React.useState('未选择');
  const [lastRequest, setLastRequest] = React.useState<unknown>(null);
  const [uploadOk, setUploadOk] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    // 预览用：把即将发出的请求参数摊开给人看（body 用占位文案，避免把二进制塞进 JSON）
    const request = buildUploadRequest(file);
    setSelectedFileLabel(`${file.name} (${file.size} bytes)`);
    setLastRequest({
      method: request.method,
      url: request.url,
      headers: request.headers,
      body: `<binary ${file.size} bytes>`,
    });
    setUploadOk(false);
    setErrorMessage('');
    setUploading(true);

    try {
      // ★ 核心上传逻辑在 uploadBinary.ts，页面只负责调用
      await uploadBinary(file);
      setUploadOk(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header>
        <Typography.Title level={3} style={{ color: '#fff', margin: 0 }}>
          Binary Upload Proxy Demo
        </Typography.Title>
      </Header>
      <Content style={{ padding: 24 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Alert
            type="info"
            showIcon
            message="重点只看两个文件"
            description={
              <span>
                前端发请求：<Typography.Text code>src/uploadBinary.ts</Typography.Text>
                {' · '}
                后端收处理：<Typography.Text code>src/server/handleUploadBinary.ts</Typography.Text>
              </span>
            }
          />

          <Card title="操作">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Typography.Text>选文件后，前端会立刻把文件原始二进制 POST 到 `/api/upload-binary`。</Typography.Text>
              <input type="file" onChange={(event) => void handleFileChange(event)} />
              <Typography.Text>当前文件：{selectedFileLabel}</Typography.Text>
              <Typography.Text type="secondary">
                最少参数：`query.fileName`、header `content-type`、HTTP body binary。
              </Typography.Text>
              <Typography.Text type="secondary">
                后端收到的参数会打在跑 `pnpm dev` 的终端控制台，不回显到页面。
              </Typography.Text>
            </Space>
          </Card>

          {uploading ? <Spin tip="上传中" /> : null}

          {errorMessage ? <Alert type="error" message={errorMessage} /> : null}

          {uploadOk ? <Alert type="success" message="上传成功。后端收到的参数请看终端控制台。" /> : null}

          <Card title="前端将发送的 req 参数">
            <JsonBlock emptyText="先选文件。" value={lastRequest} />
          </Card>
        </Space>
      </Content>
    </Layout>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
