import { act, render, screen } from "@testing-library/react";
import { App as AntdApp } from "antd";
import { describe, expect, it } from "vitest";
import ToastBridge from "@/components/auth/ToastBridge";
import { emitUnauthorized } from "@/lib/auth-events";
import { emitToast } from "@/lib/toast-events";

function renderBridge() {
  return render(
    <AntdApp>
      <ToastBridge />
    </AntdApp>,
  );
}

describe("ToastBridge", () => {
  it("renders an emitted toast", async () => {
    renderBridge();

    act(() => {
      emitToast("success", "登录成功");
    });

    expect(await screen.findByText("登录成功")).toBeInTheDocument();
  });

  it("renders the expired-session warning on unauthorized", async () => {
    renderBridge();

    act(() => {
      emitUnauthorized();
    });

    expect(
      await screen.findByText("登录已过期，请重新登录"),
    ).toBeInTheDocument();
  });
});
