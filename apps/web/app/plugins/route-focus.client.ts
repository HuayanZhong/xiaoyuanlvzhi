/**
 * 路由切换后把焦点移到主内容，避免键盘和读屏用户停留在导航链接上。
 *
 * 使用 `from.matched.length` 跳过首次进入；等 `page:finish` 后再聚焦，
 * 保证目标页面已经挂载。
 */
export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter();
  let pending = false;

  router.afterEach((_to, from) => {
    if (from.matched.length === 0) {
      return;
    }

    pending = true;
  });

  nuxtApp.hook("page:finish", () => {
    if (!pending) {
      return;
    }

    pending = false;

    window.requestAnimationFrame(() => {
      const target =
        document.querySelector<HTMLElement>("#main") ??
        document.querySelector<HTMLElement>("main");

      target?.focus({ preventScroll: true });
    });
  });
});
