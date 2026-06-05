import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";

describe("platform-fee", () => {
  const env = { ...process.env };

  afterEach(() => {
    process.env = { ...env };
  });

  it("computePlatformFeeCents uses default 12%", async () => {
    delete process.env.PLATFORM_FEE_PERCENT;
    const { computePlatformFeeCents } = await import("@/lib/platform-fee");
    assert.equal(computePlatformFeeCents(10000), 1200);
  });

  it("computePlatformFeeCents respects env", async () => {
    process.env.PLATFORM_FEE_PERCENT = "10";
    const { computePlatformFeeCents } = await import("@/lib/platform-fee");
    assert.equal(computePlatformFeeCents(5000), 500);
  });
});
