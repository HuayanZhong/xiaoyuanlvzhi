import { beforeEach } from "vitest";
import { clearNuxtData } from "#app";
import { resetAuthForTests } from "~/composables/useAuth";

beforeEach(() => {
  resetAuthForTests();
  clearNuxtData();
});
