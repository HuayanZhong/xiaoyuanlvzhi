import { describe, expect, it, vi } from "vitest";
import { emitToast, onToast } from "../../../src/lib/toast-events";

describe("toast events", () => {
  it("notifies a subscribed listener with the payload", () => {
    const listener = vi.fn();
    const unsubscribe = onToast(listener);

    emitToast("error", "邮箱或密码错误");

    expect(listener).toHaveBeenCalledWith({
      type: "error",
      content: "邮箱或密码错误",
    });
    unsubscribe();
  });

  it("stops notifying after unsubscribe", () => {
    const listener = vi.fn();
    const unsubscribe = onToast(listener);

    unsubscribe();
    emitToast("success", "登录成功");

    expect(listener).not.toHaveBeenCalled();
  });

  it("notifies every active listener", () => {
    const first = vi.fn();
    const second = vi.fn();
    const unsubscribeFirst = onToast(first);
    const unsubscribeSecond = onToast(second);

    emitToast("warning", "登录已过期，请重新登录");

    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
    unsubscribeFirst();
    unsubscribeSecond();
  });
});
