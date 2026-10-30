export type ToastType = "success" | "error" | "warning" | "info";

export type ToastPayload = {
  type: ToastType;
  content: string;
};

type ToastListener = (toast: ToastPayload) => void;

const listeners = new Set<ToastListener>();

/** 发布页面级提示；由路由外的 ToastBridge 统一渲染。 */
export function emitToast(type: ToastType, content: string): void {
  for (const listener of listeners) {
    listener({ type, content });
  }
}

/** 订阅页面级提示；返回退订函数。 */
export function onToast(listener: ToastListener): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}
