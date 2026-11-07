import { setSessionToken } from "#server/utils/session";
import {
  errorEnvelope,
  parseEnvelope,
  requestSpring,
} from "#server/utils/spring";

type LoginBody = {
  email?: string;
  password?: string;
};

type LoginResult = {
  tokenType: string;
  accessToken: string;
  expiresAt: string;
  account: {
    id: number;
    email: string;
    role: string;
    status: string;
  };
};

export default defineEventHandler(async (event) => {
  const body = await readBody<LoginBody>(event);
  const email = body?.email?.trim();
  const password = body?.password;

  if (!email || !password) {
    return errorEnvelope(event, 400, "INVALID_REQUEST", "请输入邮箱和密码");
  }

  const response = await requestSpring<LoginResult>(event, "auth/login", {
    method: "POST",
    body: { email, password },
  });
  // oxlint-disable-next-line eslint/no-underscore-dangle -- ofetch raw response
  const envelope = parseEnvelope<LoginResult>(response._data);

  if (!response.ok || !envelope?.success || !envelope.data) {
    setResponseStatus(event, response.status);
    return (
      envelope ?? {
        success: false,
        data: null,
        error: {
          code: response.status === 401 ? "UNAUTHORIZED" : "LOGIN_FAILED",
          message:
            response.status === 401
              ? "邮箱或密码不正确"
              : "登录失败，请稍后重试",
        },
      }
    );
  }

  if (
    envelope.data.account.role !== "STUDENT" ||
    envelope.data.account.status !== "ACTIVE"
  ) {
    void requestSpring(event, "auth/logout", {
      method: "POST",
      token: envelope.data.accessToken,
    }).catch(() => undefined);

    return errorEnvelope(
      event,
      403,
      "NOT_STUDENT",
      "仅正常状态的学生账号可进入学生端",
    );
  }

  setSessionToken(event, envelope.data.accessToken);

  return {
    success: true,
    data: {
      account: envelope.data.account,
      expiresAt: envelope.data.expiresAt,
    },
    error: null,
  };
});
