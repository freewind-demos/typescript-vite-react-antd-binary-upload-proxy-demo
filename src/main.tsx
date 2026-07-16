import React, { type ChangeEvent, type FC } from 'react';
import ReactDOM from 'react-dom/client';
import { Alert, Card, Layout, Space, Spin, Typography } from 'antd';

const { Content, Header } = Layout;

type RequestPreview = {
  method: 'POST';
  url: string;
  headers: Record<string, string>;
  body: string;
};

const buildRequestPreview = (file: File): RequestPreview => {
  const contentType = file.type || 'application/octet-stream';
  const query = new URLSearchParams({
    fileName: file.name,
  });

  return {
    method: 'POST',
    url: `/api/upload-binary?${query.toString()}`,
    headers: {
      'content-type': contentType,
    },
    body: `<binary ${file.size} bytes>`,
  };
};

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
  const [lastRequest, setLastRequest] = React.useState<RequestPreview | null>(null);
  const [uploadOk, setUploadOk] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    const requestPreview = buildRequestPreview(file);
    setSelectedFileLabel(`${file.name} (${file.size} bytes)`);
    setLastRequest(requestPreview);
    setUploadOk(false);
    setErrorMessage('');
    setUploading(true);

    try {
      const response = await fetch(requestPreview.url, {
        method: requestPreview.method,
        headers: requestPreview.headers,
        body: file,
      });
      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(responseText || `upload failed with ${response.status}`);
      }

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
