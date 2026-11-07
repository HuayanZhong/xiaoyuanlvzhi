import { clearSessionToken, readSessionToken } from "#server/utils/session";
import { requestSpring } from "#server/utils/spring";

export default defineEventHandler(async (event) => {
  const token = readSessionToken(event);
  let revokeFailed = false;

  if (token) {
    try {
      const response = await requestSpring<null>(event, "auth/logout", {
        method: "POST",
        token,
      });

      revokeFailed = !response.ok && response.status !== 401;
    } catch {
      revokeFailed = true;
    }
  }

  clearSessionToken(event);

  return {
    success: true,
    data: { revokeFailed },
    error: null,
  };
});
