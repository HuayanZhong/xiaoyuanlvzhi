import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { App as AntdApp } from "antd";
import { describe, expect, it, vi } from "vitest";
import LoginForm, { type LoginValues } from "@/components/auth/LoginForm";
import ToastBridge from "@/components/auth/ToastBridge";

function fillForm(username = "admin", password = "123456") {
  fireEvent.change(screen.getByPlaceholderText("请输入管理员账号"), {
    target: { value: username },
  });
  fireEvent.change(screen.getByPlaceholderText("请输入密码"), {
    target: { value: password },
  });
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: /登\s*录/ }));
}

function renderForm(onSubmit: (values: LoginValues) => Promise<void>) {
  return render(
    <AntdApp>
      <ToastBridge />
      <LoginForm onSubmit={onSubmit} />
    </AntdApp>,
  );
}

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });

  return { promise, resolve };
}

describe("LoginForm", () => {
  it("submits the entered credentials", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderForm(onSubmit);

    fillForm();
    submit();

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        username: "admin",
        password: "123456",
      });
    });
  });

  it("shows required errors for an empty submit", async () => {
    const onSubmit = vi.fn();
    renderForm(onSubmit);

    submit();

    expect(await screen.findByText("请输入管理员账号")).toBeInTheDocument();
    expect(await screen.findByText("请输入密码")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects a whitespace-only password", async () => {
    const onSubmit = vi.fn();
    renderForm(onSubmit);

    fillForm("admin", "   ");
    submit();

    expect(await screen.findByText("密码不能为空白")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("accepts a password shorter than six characters", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderForm(onSubmit);

    fillForm("admin", "123");
    submit();

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        username: "admin",
        password: "123",
      });
    });
    expect(screen.queryByText("密码至少 6 位")).not.toBeInTheDocument();
  });

  it("shows a toast on login failure", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("邮箱或密码错误"));
    renderForm(onSubmit);

    fillForm("admin", "wrong");
    submit();

    await waitFor(() => {
      expect(
        within(screen.getByTestId("toast-list")).getByText("邮箱或密码错误"),
      ).toBeInTheDocument();
    });
    expect(screen.getAllByText("邮箱或密码错误")).toHaveLength(1);
  });

  it("does not submit twice while a request is pending", async () => {
    const pending = deferred();
    const onSubmit = vi.fn().mockReturnValue(pending.promise);
    renderForm(onSubmit);

    fillForm();
    submit();

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledOnce();
    });

    submit();
    expect(onSubmit).toHaveBeenCalledOnce();

    pending.resolve();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /登\s*录/ })).toBeEnabled();
    });
  });
});
