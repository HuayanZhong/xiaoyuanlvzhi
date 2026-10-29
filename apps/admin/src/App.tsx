import { App as AntdApp, ConfigProvider, theme as antdTheme } from "antd";
import zhCN from "antd/locale/zh_CN";
import { useLayoutEffect } from "react";
import { RouterProvider } from "react-router/dom";
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
        <RouterProvider router={router} />
      </AntdApp>
    </ConfigProvider>
  );
}
