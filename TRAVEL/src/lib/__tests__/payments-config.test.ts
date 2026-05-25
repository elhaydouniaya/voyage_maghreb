import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";

describe("payments-config", () => {
  const env = { ...process.env };

  beforeEach(() => {
    process.env = { ...env };
  });

  afterEach(() => {
    process.env = env;
  });

  it("isDemoPaymentsAllowed is true in development", async () => {
    process.env = { ...env, NODE_ENV: "development" };
    delete process.env.ALLOW_DEMO_PAYMENTS;
    const { isDemoPaymentsAllowed } = await import("@/lib/payments-config");
    assert.equal(isDemoPaymentsAllowed(), true);
  });

  it("isDemoPaymentsAllowed is false in production by default", async () => {
    process.env = { ...env, NODE_ENV: "production" };
    delete process.env.ALLOW_DEMO_PAYMENTS;
    const { isDemoPaymentsAllowed } = await import("@/lib/payments-config");
    assert.equal(isDemoPaymentsAllowed(), false);
  });

  it("isDemoPaymentsAllowed respects ALLOW_DEMO_PAYMENTS in production", async () => {
    process.env = { ...env, NODE_ENV: "production", ALLOW_DEMO_PAYMENTS: "true" };
    const { isDemoPaymentsAllowed } = await import("@/lib/payments-config");
    assert.equal(isDemoPaymentsAllowed(), true);
  });
});
