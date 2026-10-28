import BrandMark from "@/components/BrandMark";

const modules = ["绿植资源", "领养审核", "环保活动", "数据统计"];

export default function AuthBrandPanel() {
  return (
    <aside className="hidden px-10 py-10 lg:flex lg:flex-col xl:px-16 xl:py-12">
      <div className="mx-auto flex w-full max-w-panel flex-1 flex-col justify-between xl:max-w-panel-xl 2xl:max-w-panel-2xl">
        <BrandMark />

        <div>
          <div className="mb-6 h-px w-10 bg-accent" />
          <p className="text-xs font-medium tracking-label text-muted">
            校园绿植领养与环保激励系统
          </p>
          <h2 className="mt-4 text-display font-semibold leading-display tracking-tight text-ink xl:text-display-xl 2xl:text-display-2xl">
            管理端
          </h2>
          <p className="mt-6 max-w-copy text-body leading-7 text-muted">
            维护绿植资源，处理领养申请，管理环保活动与积分记录。
          </p>

          <div className="mt-10 xl:mt-12">
            <div className="flex items-center gap-4">
              <p className="shrink-0 text-label font-medium tracking-label text-muted">
                系统模块
              </p>
              <span aria-hidden="true" className="h-px flex-1 bg-line" />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-y-4 text-sm text-muted xl:grid-cols-4 xl:gap-y-0">
              {modules.map((module) => (
                <div
                  className="flex items-center gap-2.5 xl:border-l xl:border-line xl:pl-6 xl:first:border-l-0 xl:first:pl-0"
                  key={module}
                >
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 rounded-full bg-primary"
                  />
                  {module}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted">
          <span>内部管理系统 · 仅限管理员使用</span>
          <span className="font-mono text-label">2026</span>
        </div>
      </div>
    </aside>
  );
}
