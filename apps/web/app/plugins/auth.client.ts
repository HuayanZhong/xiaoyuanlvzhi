import { clearAuth } from "~/composables/useAuth";
import { onUnauthorized } from "~/utils/auth-events";
import { createUnauthorizedHandler } from "~/utils/auth-session";

export default defineNuxtPlugin(() => {
  const route = useRoute();
  const handler = createUnauthorizedHandler({
    getRoute: () => ({ path: route.path, fullPath: route.fullPath }),
    clear: clearAuth,
    navigate: (target) => {
      void navigateTo(target);
    },
  });

  onUnauthorized(handler);
});
