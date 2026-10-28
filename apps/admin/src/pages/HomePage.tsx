import { Typography } from "antd";

const { Paragraph, Title } = Typography;

export default function HomePage() {
  return (
    <main className="p-8">
      <Title level={1}>管理后台</Title>
      <Paragraph type="secondary">
        路由与状态管理骨架已就绪，后续在这里添加业务页面。
      </Paragraph>
    </main>
  );
}
