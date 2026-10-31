import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/api/client";
import * as pointsApi from "@/api/points";
import { emitToast } from "@/lib/toast-events";
import PointRuleDrawer from "@/pages/points/PointRuleDrawer";
import { makeRule } from "./fixtures";

vi.mock("@/api/points", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/points")>();

  return {
    ...actual,
    updatePointRule: vi.fn(),
  };
});

vi.mock("@/lib/toast-events", () => ({
  emitToast: vi.fn(),
}));

const updatePointRule = vi.mocked(pointsApi.updatePointRule);
const emitToastMock = vi.mocked(emitToast);

function renderDrawer(
  overrides: Partial<Parameters<typeof PointRuleDrawer>[0]> = {},
) {
  const props = {
    open: true,
    rule: makeRule(),
    onClose: vi.fn(),
    onSaved: vi.fn(),
    ...overrides,
  };

  render(
    <ConfigProvider locale={zhCN}>
      <PointRuleDrawer {...props} />
    </ConfigProvider>,
  );

  return props;
}

describe("PointRuleDrawer", () => {
  beforeEach(() => {
    updatePointRule.mockReset();
    emitToastMock.mockReset();
    updatePointRule.mockResolvedValue(makeRule());
  });

  it("saves the care rule with editable points and frequency", async () => {
    const props = renderDrawer();

    const pointsInput = await screen.findByLabelText("每次积分");
    fireEvent.change(pointsInput, { target: { value: "12" } });
    fireEvent.click(screen.getByRole("button", { name: "保存规则" }));

    await waitFor(() => {
      expect(updatePointRule).toHaveBeenCalledWith("CARE_CHECKIN", {
        points: 12,
        frequencyLimit: 1,
        frequencyPeriod: "DAILY",
        enabled: true,
      });
    });
    expect(props.onSaved).toHaveBeenCalled();
    expect(props.onClose).toHaveBeenCalled();
    expect(emitToastMock).toHaveBeenCalledWith("success", "积分规则已更新");
  });

  it("saves the eco rule with zero points and no points input", async () => {
    const props = renderDrawer({
      rule: makeRule({
        id: 2,
        sourceType: "ECO_TASK",
        points: 0,
        frequencyLimit: null,
        frequencyPeriod: null,
      }),
    });

    expect(
      await screen.findByText(
        "环保任务的每次积分由任务配置决定；本规则只控制启用状态和每日/每周频控。",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("每次积分")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "保存规则" }));

    await waitFor(() => {
      expect(updatePointRule).toHaveBeenCalledWith("ECO_TASK", {
        points: 0,
        frequencyLimit: null,
        frequencyPeriod: null,
        enabled: true,
      });
    });
    expect(props.onSaved).toHaveBeenCalled();
  });

  it("rejects an empty care points value before calling the API", async () => {
    renderDrawer();

    const pointsInput = await screen.findByLabelText("每次积分");
    fireEvent.change(pointsInput, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "保存规则" }));

    expect(await screen.findByText("请填写积分")).toBeInTheDocument();
    expect(updatePointRule).not.toHaveBeenCalled();
  });

  it("keeps the drawer open and maps a rule error", async () => {
    updatePointRule.mockRejectedValue(
      new ApiError("POINT_RULE_POINTS_INVALID", "bad"),
    );
    const props = renderDrawer();

    await screen.findByLabelText("每次积分");
    fireEvent.click(screen.getByRole("button", { name: "保存规则" }));

    await waitFor(() => {
      expect(emitToastMock).toHaveBeenCalledWith(
        "error",
        "养护打卡积分必须大于 0",
      );
    });
    expect(props.onClose).not.toHaveBeenCalled();
    expect(props.onSaved).not.toHaveBeenCalled();
  });
});
