import { Breadcrumb, Card, Flex, Typography } from "antd";
import type { ReactNode } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";

type ModulePageProps = {
  title: string;
  extra?: ReactNode;
  children: ReactNode;
};

/** 后台壳内的模块页面容器：面包屑、标题和与占位页一致的内容区留白。 */
export default function ModulePage({
  title,
  extra,
  children,
}: ModulePageProps) {
  const { breadcrumb } = usePageMeta();
  const items = breadcrumb.map((part) => ({ title: part.title }));

  return (
    <Card
      styles={{
        body: {
          display: "flex",
          flexDirection: "column",
          gap: 16,
          minHeight: "calc(100vh - 114px)",
        },
      }}
      variant="borderless"
    >
      <Flex align="flex-end" gap={16} justify="space-between" wrap>
        <div>
          <Breadcrumb items={items} />
          <Typography.Title level={3} style={{ margin: 0 }}>
            {title}
          </Typography.Title>
        </div>
        {extra}
      </Flex>

      {children}
    </Card>
  );
}
