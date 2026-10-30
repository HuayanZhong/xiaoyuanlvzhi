import { App as AntdApp, ConfigProvider, theme as antdTheme } from "antd";
import zhCN from "antd/locale/zh_CN";
import { useLayoutEffect } from "react";
import { RouterProvider } from "react-router/dom";
import SessionGate from "@/components/auth/SessionGate";
import ToastBridge from "@/components/auth/ToastBridge";
import ThemeTokenBridge from "@/components/ThemeTokenBridge";
import { router } from "@/router";
import { useAppStore } from "@/stores/app";

export default function App() {
  const isDark = useAppStore((state) => state.themeMode === "dark");

  useLayoutEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: isDark
          ? antdTheme.darkAlgorithm
          : antdTheme.defaultAlgorithm,
      }}
    >
      <AntdApp>
        <ThemeTokenBridge />
        <ToastBridge />
        <SessionGate>
          <RouterProvider router={router} />
        </SessionGate>
      </AntdApp>
    </ConfigProvider>
  );
}
