import { setSessionToken } from "#server/utils/session";
import {
  errorEnvelope,
  parseEnvelope,
  requestSpring,
} from "#server/utils/spring";

type RegisterResult = {
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
  const body = await readBody(event);
  const response = await requestSpring<RegisterResult>(event, "auth/register", {
    method: "POST",
    body,
  });
  // oxlint-disable-next-line eslint/no-underscore-dangle -- ofetch raw response
  const envelope = parseEnvelope<RegisterResult>(response._data);

  if (!response.ok || !envelope?.success || !envelope.data) {
    setResponseStatus(event, response.status);
    return (
      envelope ?? {
        success: false,
        data: null,
        error: {
          code: "REGISTER_FAILED",
          message: "注册失败，请稍后重试",
        },
      }
    );
  }

  if (
    envelope.data.account.role !== "STUDENT" ||
    envelope.data.account.status !== "ACTIVE"
  ) {
    return errorEnvelope(event, 403, "NOT_STUDENT", "当前账号不能进入学生端");
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
