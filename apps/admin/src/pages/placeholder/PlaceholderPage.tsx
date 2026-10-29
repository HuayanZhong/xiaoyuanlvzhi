import { Breadcrumb, Card, Empty, Flex, Typography } from "antd";
import { usePageMeta } from "@/hooks/usePageMeta";

type PlaceholderPageProps = {
  description?: string;
};

/** 模块占位页；本变更只落地路由与壳层，不实现业务内容。 */
export default function PlaceholderPage({
  description = "该模块正在建设中",
}: PlaceholderPageProps) {
  const { item, breadcrumb } = usePageMeta();
  const breadcrumbItems = breadcrumb.map((part) => ({ title: part.title }));

  return (
    <Card
      styles={{
        body: {
          display: "flex",
          flexDirection: "column",
          minHeight: "calc(100vh - 114px)",
        },
      }}
    >
      <Breadcrumb items={breadcrumbItems} />
      <Typography.Title level={3}>{item?.label ?? "模块"}</Typography.Title>

      <Flex align="center" flex={1} justify="center">
        <Empty description={description} />
      </Flex>
    </Card>
  );
}
