import { Breadcrumb, Card, Flex, Typography } from "antd";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { usePageMeta } from "@/hooks/usePageMeta";
import PageStats, { type PageStat } from "./PageStats";

type ModulePageProps = {
  title: string;
  extra?: ReactNode;
  stats?: PageStat[];
  children: ReactNode;
};

/** 后台壳内的模块页面容器：面包屑、标题、概览、内容与同组页面入口。 */
export default function ModulePage({
  title,
  extra,
  stats,
  children,
}: ModulePageProps) {
  const { breadcrumb, group, item } = usePageMeta();
  const items = breadcrumb.map((part) => ({ title: part.title }));
  const siblings =
    group?.items.filter((sibling) => sibling.key !== item?.key) ?? [];

  return (
    <Card
      styles={{
        body: {
          display: "flex",
          flexDirection: "column",
          gap: 16,
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

      {stats && stats.length > 0 ? <PageStats items={stats} /> : null}

      {children}

      {siblings.length > 0 ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4">
          <span className="text-caption text-muted">本组页面</span>
          {siblings.map((sibling) => {
            const Icon = sibling.icon;

            return (
              <Link
                className="inline-flex items-center gap-1.5 text-body text-primary hover:underline"
                key={sibling.key}
                to={sibling.path}
              >
                <Icon />
                {sibling.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </Card>
  );
}
