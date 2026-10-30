import type { ToastType } from "./toast-events";

const TOAST_DURATION_MS = 3000;
const LEAVE_DURATION_MS = 200;
const CONTAINER_ID = "admin-toast-container";

const ICON_SVG: Record<ToastType, string> = {
  success:
    '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="9" fill="currentColor"/><path d="M6 10.4 8.6 13 14.2 7.4" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  error:
    '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="9" fill="currentColor"/><path d="m7 7 6 6M13 7l-6 6" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>',
  warning:
    '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="9" fill="currentColor"/><path d="M10 5.5v5.2" stroke="#fff" stroke-width="2" stroke-linecap="round"/><circle cx="10" cy="14.2" r="1.1" fill="#fff"/></svg>',
  info: '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="9" fill="currentColor"/><path d="M10 9v5.2" stroke="#fff" stroke-width="2" stroke-linecap="round"/><circle cx="10" cy="5.9" r="1.1" fill="#fff"/></svg>',
};

/**
 * 在页面顶部居中显示一条提示。
 *
 * 直接挂到 body，不依赖 React 生命周期或 antd message holder，路由切换、
 * 组件卸载后仍能正常显示；样式见 global.css 的 `.app-toast`。
 */
export function showToast(type: ToastType, content: string): void {
  if (typeof document === "undefined") {
    return;
  }

  const container = getContainer();
  const toast = document.createElement("div");
  const icon = document.createElement("span");
  const text = document.createElement("span");

  toast.className = `app-toast app-toast--${type}`;
  toast.setAttribute(
    "role",
    type === "error" || type === "warning" ? "alert" : "status",
  );
  icon.className = "app-toast__icon";
  icon.innerHTML = ICON_SVG[type];
  text.className = "app-toast__content";
  text.textContent = content;
  toast.append(icon, text);
  container.appendChild(toast);

  window.setTimeout(() => {
    toast.classList.add("is-leaving");
    window.setTimeout(() => toast.remove(), LEAVE_DURATION_MS);
  }, TOAST_DURATION_MS);
}

function getContainer(): HTMLDivElement {
  const existing = document.getElementById(CONTAINER_ID);

  if (existing instanceof HTMLDivElement) {
    return existing;
  }

  const container = document.createElement("div");
  container.id = CONTAINER_ID;
  container.dataset.testid = "toast-list";
  container.setAttribute("aria-live", "polite");
  container.className = "app-toast-list";
  document.body.appendChild(container);

  return container;
}
