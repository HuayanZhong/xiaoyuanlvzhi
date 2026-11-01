import { beforeEach } from "vitest";
import { resetAuthForTests } from "~/composables/useAuth";

beforeEach(() => {
  resetAuthForTests();
});
