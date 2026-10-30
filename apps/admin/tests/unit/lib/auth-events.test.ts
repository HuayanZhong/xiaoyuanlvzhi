import { describe, expect, it, vi } from "vitest";
import { emitUnauthorized, onUnauthorized } from "../../../src/lib/auth-events";

describe("auth events", () => {
  it("notifies a subscribed listener", () => {
    const listener = vi.fn();
    const unsubscribe = onUnauthorized(listener);

    emitUnauthorized();

    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
  });

  it("stops notifying after unsubscribe", () => {
    const listener = vi.fn();
    const unsubscribe = onUnauthorized(listener);

    unsubscribe();
    emitUnauthorized();

    expect(listener).not.toHaveBeenCalled();
  });

  it("notifies every active listener", () => {
    const first = vi.fn();
    const second = vi.fn();
    const unsubscribeFirst = onUnauthorized(first);
    const unsubscribeSecond = onUnauthorized(second);

    emitUnauthorized();

    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
    unsubscribeFirst();
    unsubscribeSecond();
  });
});
