import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";

describe("oauth", () => {
  const env = { ...process.env };

  beforeEach(() => {
    process.env = { ...env };
  });

  afterEach(() => {
    process.env = env;
  });

  it("isGoogleOAuthEnabled when both credentials are set", async () => {
    process.env.GOOGLE_CLIENT_ID = "real-client-id";
    process.env.GOOGLE_CLIENT_SECRET = "real-secret";
    const { isGoogleOAuthEnabled } = await import("@/lib/oauth");
    assert.equal(isGoogleOAuthEnabled(), true);
  });

  it("isGoogleOAuthEnabled is false when only secret is set", async () => {
    delete process.env.GOOGLE_CLIENT_ID;
    process.env.GOOGLE_CLIENT_SECRET = "orphan-secret";
    const { isGoogleOAuthEnabled } = await import("@/lib/oauth");
    assert.equal(isGoogleOAuthEnabled(), false);
  });

  it("isGoogleOAuthEnabled rejects mock placeholders", async () => {
    process.env.GOOGLE_CLIENT_ID = "mock-id";
    process.env.GOOGLE_CLIENT_SECRET = "mock-secret";
    const { isGoogleOAuthEnabled } = await import("@/lib/oauth");
    assert.equal(isGoogleOAuthEnabled(), false);
  });
});
