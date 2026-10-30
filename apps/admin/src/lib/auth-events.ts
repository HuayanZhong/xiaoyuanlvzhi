type UnauthorizedListener = () => void;

const listeners = new Set<UnauthorizedListener>();

/** 订阅未认证事件；返回退订函数。 */
export function onUnauthorized(listener: UnauthorizedListener): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

/** 通知所有订阅者：当前 token 已失效。 */
export function emitUnauthorized(): void {
  for (const listener of listeners) {
    listener();
  }
}
