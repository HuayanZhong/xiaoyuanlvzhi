import { describe, expect, it } from "vitest";
import { AppController } from "../../src/app.controller";

describe("AppController", () => {
  it("returns the service information", () => {
    const controller = new AppController();

    expect(controller.getInfo()).toEqual({ name: "bff", status: "ok" });
  });

  it("returns a healthy status", () => {
    const controller = new AppController();

    expect(controller.getHealth()).toEqual({ status: "ok" });
  });
});
