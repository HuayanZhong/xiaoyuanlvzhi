import { beforeEach } from "vitest";
import { clearNuxtData } from "#app";
import { resetAuthForTests } from "~/composables/useAuth";
import { clearFileCache } from "~/composables/useFileUrl";

beforeEach(() => {
  resetAuthForTests();
  clearNuxtData();
  clearFileCache();
});
