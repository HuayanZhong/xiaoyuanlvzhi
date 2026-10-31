import { fireEvent, render, screen } from "@testing-library/react";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import { describe, expect, it, vi } from "vitest";
import PointRulesPanel from "@/pages/points/PointRulesPanel";
import { makeRule } from "./fixtures";

function renderPanel(
  overrides: Partial<Parameters<typeof PointRulesPanel>[0]> = {},
) {
  const props = {
    rules: [
      makeRule(),
      makeRule({
        id: 2,
        sourceType: "ECO_TASK",
        points: 0,
        frequencyLimit: 2,
        frequencyPeriod: "WEEKLY",
      }),
    ],
    loading: false,
    failed: false,
    onRetry: vi.fn(),
    onEdit: vi.fn(),
    ...overrides,
  };

  render(
    <ConfigProvider locale={zhCN}>
      <PointRulesPanel {...props} />
    </ConfigProvider>,
  );

  return props;
}

describe("PointRulesPanel", () => {
  it("renders Chinese sources, frequency and the eco points rule", () => {
    renderPanel();

    expect(screen.getAllByText("养护打卡").length).toBeGreaterThan(0);
    expect(screen.getAllByText("环保任务").length).toBeGreaterThan(0);
    expect(screen.getByText("10 分")).toBeInTheDocument();
    expect(screen.getByText("由任务配置决定")).toBeInTheDocument();
    expect(screen.getByText("每日 1 次")).toBeInTheDocument();
    expect(screen.getByText("每周 2 次")).toBeInTheDocument();
    expect(screen.getAllByText("启用")).toHaveLength(2);
  });

  it("calls onEdit with the selected rule", () => {
    const props = renderPanel();

    fireEvent.click(screen.getAllByRole("button", { name: /编\s*辑/ })[1]!);

    expect(props.onEdit).toHaveBeenCalledWith(
      expect.objectContaining({ id: 2, sourceType: "ECO_TASK" }),
    );
  });

  it("shows an empty state and retries", () => {
    const props = renderPanel({ rules: [] });

    expect(screen.getByText("暂无积分规则")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /刷\s*新/ }));

    expect(props.onRetry).toHaveBeenCalled();
  });

  it("shows a failure state", () => {
    renderPanel({ failed: true });

    expect(
      screen.getByText("积分规则加载失败，请稍后重试"),
    ).toBeInTheDocument();
  });
});
