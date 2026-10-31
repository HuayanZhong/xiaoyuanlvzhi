import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/api/client";
import * as rewardsApi from "@/api/rewards";
import { emitToast } from "@/lib/toast-events";
import RewardFormDrawer from "@/pages/rewards/RewardFormDrawer";
import { makeReward } from "./fixtures";

vi.mock("@/api/rewards", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/rewards")>();

  return {
    ...actual,
    createReward: vi.fn(),
    updateReward: vi.fn(),
  };
});

vi.mock("@/api/files", () => ({
  loadImage: vi.fn(),
  uploadImage: vi.fn(),
}));

vi.mock("@/lib/toast-events", () => ({
  emitToast: vi.fn(),
}));

const createReward = vi.mocked(rewardsApi.createReward);
const updateReward = vi.mocked(rewardsApi.updateReward);
const emitToastMock = vi.mocked(emitToast);

function renderDrawer(
  overrides: Partial<Parameters<typeof RewardFormDrawer>[0]> = {},
) {
  const props = {
    open: true,
    reward: null,
    onClose: vi.fn(),
    onSaved: vi.fn(),
    ...overrides,
  };

  render(
    <ConfigProvider locale={zhCN}>
      <RewardFormDrawer {...props} />
    </ConfigProvider>,
  );

  return props;
}

describe("RewardFormDrawer", () => {
  beforeEach(() => {
    createReward.mockReset();
    updateReward.mockReset();
    emitToastMock.mockReset();
    createReward.mockResolvedValue(makeReward());
    updateReward.mockResolvedValue(makeReward());
  });

  it("creates a reward with trimmed fields", async () => {
    const props = renderDrawer();

    fireEvent.change(screen.getByLabelText("奖励名称"), {
      target: { value: "  环保帆布袋  " },
    });
    fireEvent.change(screen.getByLabelText("奖励描述"), {
      target: { value: "  校园环保主题  " },
    });
    fireEvent.change(screen.getByLabelText("兑换积分"), {
      target: { value: "50" },
    });
    fireEvent.change(screen.getByLabelText("总库存"), {
      target: { value: "20" },
    });
    fireEvent.change(screen.getByLabelText("领取地点"), {
      target: { value: "  学生活动中心 101  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存奖励" }));

    await waitFor(() =>
      expect(createReward).toHaveBeenCalledWith({
        name: "环保帆布袋",
        description: "校园环保主题",
        imageFileIds: [],
        pointsCost: 50,
        availableStock: 20,
        location: "学生活动中心 101",
        pickupDays: 7,
        enabled: true,
      }),
    );
    expect(emitToastMock).toHaveBeenCalledWith("success", "奖励已创建");
    expect(props.onSaved).toHaveBeenCalled();
    expect(props.onClose).toHaveBeenCalled();
  });

  it("edits a reward and shows reserved stock", async () => {
    const props = renderDrawer({ reward: makeReward() });

    expect(
      await screen.findByText("已预留 3，已领取 5，剩余可兑换 12"),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("奖励名称"), {
      target: { value: "新款帆布袋" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存奖励" }));

    await waitFor(() =>
      expect(updateReward).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ name: "新款帆布袋" }),
      ),
    );
    expect(props.onSaved).toHaveBeenCalled();
  });

  it("rejects an empty name before calling the API", async () => {
    renderDrawer({ reward: makeReward() });

    fireEvent.change(await screen.findByLabelText("奖励名称"), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存奖励" }));

    expect(await screen.findByText("请输入奖励名称")).toBeInTheDocument();
    expect(updateReward).not.toHaveBeenCalled();
  });

  it("maps a reserved stock conflict to the stock field", async () => {
    updateReward.mockRejectedValue(
      new ApiError("REWARD_STOCK_RESERVED", "stock", 409),
    );
    const props = renderDrawer({ reward: makeReward() });

    await screen.findByLabelText("奖励名称");
    fireEvent.click(screen.getByRole("button", { name: "保存奖励" }));

    expect(
      await screen.findByText("总库存不能低于已预留和已领取数量"),
    ).toBeInTheDocument();
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it("maps an invalid image error to the image field", async () => {
    updateReward.mockRejectedValue(
      new ApiError("INVALID_IMAGE_FILES", "image", 400),
    );
    renderDrawer({ reward: makeReward() });

    await screen.findByLabelText("奖励名称");
    fireEvent.click(screen.getByRole("button", { name: "保存奖励" }));

    expect(
      await screen.findByText("奖励图片不存在或尚未设为公开图片"),
    ).toBeInTheDocument();
  });
});
