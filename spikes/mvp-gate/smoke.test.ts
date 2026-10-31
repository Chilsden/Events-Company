import { test, expect } from "vitest";

// Gate check 11: the test runner executes a passing test (run with `npx vitest run` in the throwaway folder).
test("vitest runs", () => {
  expect(1 + 1).toBe(2);
});
