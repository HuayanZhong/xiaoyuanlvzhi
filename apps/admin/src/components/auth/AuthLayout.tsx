import type { ReactNode } from "react";
import BrandMark from "@/components/BrandMark";
import ThemeToggle from "@/components/ThemeToggle";
import AuthBrandPanel from "./AuthBrandPanel";

type AuthLayoutProps = {
  children: ReactNode;
  description: string;
  title: string;
};

export default function AuthLayout({
  children,
  description,
  title,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-canvas">
      <div className="relative min-h-screen w-full bg-canvas lg:grid lg:grid-cols-[minmax(0,1fr)_var(--auth-drawer-width)]">
        <AuthBrandPanel />

        <main className="relative flex min-h-screen flex-col bg-canvas lg:border-l lg:border-line lg:bg-surface">
          <div className="absolute right-10 top-10 z-10 hidden lg:block xl:top-12">
            <ThemeToggle />
          </div>

          <header className="flex h-14 shrink-0 items-center justify-between border-b border-line px-5 lg:hidden">
            <BrandMark compact />
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted">管理端</span>
              <ThemeToggle />
            </div>
          </header>

          <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8 lg:px-10">
            <div className="w-full max-w-form rounded-surface border border-line bg-surface p-5 sm:p-8 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0">
              <h1 className="text-title font-semibold text-ink">{title}</h1>
              <p className="mt-2 text-body leading-7 text-muted">
                {description}
              </p>

              <div className="mt-7">{children}</div>

              <p className="mt-10 text-center text-caption text-muted lg:hidden">
                © 2026 校园绿植领养与环保激励系统
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
