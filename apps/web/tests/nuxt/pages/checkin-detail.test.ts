import { flushPromises } from "@vue/test-utils";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { clearNuxtData } from "#app";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "~/utils/api";
import {
  getCheckin,
  resubmitCheckin,
  type CareCheckin,
  type CareSubmission,
} from "~/utils/care-api";
import CheckinDetailPage from "../../../app/pages/care/[id].vue";

vi.mock("~/utils/care-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~/utils/care-api")>();

  return { ...actual, getCheckin: vi.fn(), resubmitCheckin: vi.fn() };
});

vi.mock("~/composables/useFileUrl", () => ({
  useFileUrl: () => ({
    url: null,
    loading: false,
    error: false,
    retry: vi.fn(),
  }),
}));

const getMock = vi.mocked(getCheckin);
const resubmitMock = vi.mocked(resubmitCheckin);
const mounted: Array<{ unmount: () => void }> = [];

async function mountPage(route = "/care/9") {
  const wrapper = await mountSuspended(CheckinDetailPage, { route });
  mounted.push(wrapper);

  return wrapper;
}

function submission(overrides: Partial<CareSubmission> = {}): CareSubmission {
  return {
    id: 1,
    version: 1,
    note: "今天浇水并擦拭叶片",
    imageFileIds: [],
    status: "PENDING_REVIEW",
    reviewReason: null,
    reviewerEmail: null,
    submittedAt: "2026-10-28T09:00:00",
    reviewedAt: null,
    ...overrides,
  };
}

function checkin(overrides: Partial<CareCheckin> = {}): CareCheckin {
  return {
    id: 9,
    checkinNo: "CARE-9",
    studentId: 2,
    studentEmail: "student@qq.com",
    plantId: 10,
    plantCode: "PLANT-010",
    plantName: "绿萝 · PLANT-010",
    location: "图书馆一楼",
    status: "PENDING_REVIEW",
    latestVersion: 1,
    createdAt: "2026-10-28T09:00:00",
    updatedAt: "2026-10-28T09:00:00",
    submissions: [submission()],
    ...overrides,
  };
}

describe("check-in detail page", () => {
  beforeEach(() => {
    getMock.mockReset();
    resubmitMock.mockReset();
    clearNuxtData("care-checkin:9");
  });

  afterEach(() => {
    for (const wrapper of mounted.splice(0)) {
      wrapper.unmount();
    }
  });

  it("shows the pending record and its evidence", async () => {
    getMock.mockResolvedValue(checkin());
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("CARE-9");
    expect(wrapper.text()).toContain("待审核");
    expect(wrapper.text()).toContain("今天浇水并擦拭叶片");
    expect(wrapper.text()).toContain("第 1 次提交");
    expect(wrapper.find("form").exists()).toBe(false);
  });

  it("explains how approved points are issued", async () => {
    getMock.mockResolvedValue(
      checkin({
        status: "APPROVED",
        submissions: [submission({ status: "APPROVED" })],
      }),
    );
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("已通过");
    expect(wrapper.text()).toContain("积分按积分规则发放");
    expect(wrapper.text()).not.toContain("分）");
  });

  it("shows the rejection reason and a resubmit form", async () => {
    getMock.mockResolvedValue(
      checkin({
        status: "REJECTED",
        submissions: [
          submission({
            status: "REJECTED",
            reviewReason: "照片不清晰，请重新上传",
          }),
        ],
      }),
    );
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("已驳回");
    expect(wrapper.text()).toContain("照片不清晰，请重新上传");
    expect(wrapper.find("form").exists()).toBe(true);
  });

  it("resubmits and reloads the record", async () => {
    getMock
      .mockResolvedValueOnce(
        checkin({
          status: "REJECTED",
          submissions: [
            submission({ status: "REJECTED", reviewReason: "照片不清晰" }),
          ],
        }),
      )
      .mockResolvedValueOnce(
        checkin({
          latestVersion: 2,
          submissions: [
            submission({ status: "REJECTED", reviewReason: "照片不清晰" }),
            submission({ id: 2, version: 2, note: "补充了新的照片" }),
          ],
        }),
      );
    resubmitMock.mockResolvedValue(checkin());
    const wrapper = await mountPage();
    await flushPromises();

    await wrapper.get("textarea").setValue("补充了新的照片");
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(resubmitMock).toHaveBeenCalledWith(9, {
      note: "补充了新的照片",
    });
    expect(wrapper.text()).toContain("待审核");
    expect(wrapper.text()).toContain("第 2 次提交");
  });

  it("asks to refresh when the evidence was already reviewed", async () => {
    getMock.mockResolvedValue(
      checkin({
        status: "REJECTED",
        submissions: [submission({ status: "REJECTED" })],
      }),
    );
    resubmitMock.mockRejectedValue(
      new ApiError(
        "CARE_SUBMISSION_ALREADY_REVIEWED",
        "最新打卡凭证已处理，请刷新后重试",
      ),
    );
    const wrapper = await mountPage();
    await flushPromises();

    await wrapper.get("textarea").setValue("补充说明");
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(wrapper.text()).toContain("最新打卡凭证已处理");
    expect(
      wrapper.findAll("button").some((item) => item.text() === "刷新详情"),
    ).toBe(true);
  });

  it("explains when the record is unavailable", async () => {
    getMock.mockRejectedValue(
      new ApiError("CARE_CHECKIN_NOT_FOUND", "打卡记录不存在", 404),
    );
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("无法查看这条打卡");
    expect(
      wrapper
        .findAll("a")
        .some((item) => item.attributes("href") === "/my-plants"),
    ).toBe(true);
  });
});
