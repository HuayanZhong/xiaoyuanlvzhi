import { Button, Card, Empty, Statistic } from "antd";
import { useNavigate } from "react-router";
import BrandMark from "@/components/BrandMark";
import ThemeToggle from "@/components/ThemeToggle";

const stats = [
  { suffix: "条", title: "领养申请", value: 0 },
  { suffix: "条", title: "待审核", value: 0 },
  { suffix: "场", title: "环保活动", value: 0 },
];

const modules = [
  "工作台",
  "绿植资源",
  "领养管理",
  "养护审核",
  "环保任务",
  "积分与奖励",
  "学生管理",
  "资讯管理",
  "数据统计",
];

export default function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-5 sm:px-6 lg:px-8">
          <BrandMark compact />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button onClick={() => navigate("/login")} size="small" type="text">
              返回登录
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mb-6">
          <h1 className="text-title font-semibold text-ink">数据概览</h1>
          <p className="mt-1 text-body text-muted">
            待审核事项和关键指标将在接入业务数据后显示。
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.title} size="small">
              <Statistic
                suffix={stat.suffix}
                title={stat.title}
                value={stat.value}
                styles={{
                  content: {
                    fontSize: "var(--text-value)",
                    fontWeight: "var(--font-weight-semibold)",
                  },
                }}
              />
            </Card>
          ))}
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-5">
          <Card
            className="lg:col-span-3"
            extra={<span className="text-xs text-muted">0 项</span>}
            size="small"
            title="待处理"
          >
            <Empty
              description="暂无待审核事项"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </Card>

          <Card className="lg:col-span-2" size="small" title="后续模块">
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-muted">
              {modules.map((module) => (
                <li className="flex items-center gap-2" key={module}>
                  <span
                    aria-hidden="true"
                    className="h-1 w-1 rounded-full bg-primary"
                  />
                  {module}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </main>
    </div>
  );
}
