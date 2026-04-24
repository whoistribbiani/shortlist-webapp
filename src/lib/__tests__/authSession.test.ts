import { afterEach, describe, expect, it } from "vitest";

import { clearAuthToken, getAuthToken, setAuthToken } from "../authSession";

describe("authSession", () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it("stores and reads auth token", () => {
    setAuthToken("token-1");
    expect(getAuthToken()).toBe("token-1");
  });

  it("clears auth token", () => {
    setAuthToken("token-1");
    clearAuthToken();
    expect(getAuthToken()).toBeNull();
  });
});
