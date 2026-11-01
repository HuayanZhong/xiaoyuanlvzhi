import { resolveAuthRedirect } from "~/utils/auth-route";
import { useAuth } from "~/composables/useAuth";

export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuth();

  if (auth.status.value === "checking") {
    await auth.restore();
  }

  const redirect = resolveAuthRedirect(
    { path: to.path, fullPath: to.fullPath, query: to.query },
    {
      status: auth.status.value,
      isAuthenticated: auth.isAuthenticated.value,
    },
  );

  return redirect ? navigateTo(redirect) : undefined;
});
