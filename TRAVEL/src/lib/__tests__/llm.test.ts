import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";

describe("llm", () => {
  const env = { ...process.env };

  afterEach(() => {
    process.env = { ...env };
  });

  it("isLlmConfigured rejects placeholder keys", async () => {
    process.env.GROQ_API_KEY = "";
    process.env.LLM_API_KEY = "";
    process.env.LLM_BASE_URL = "";
    process.env.OPENAI_API_KEY = "sk-...";
    const { isLlmConfigured } = await import("@/lib/llm");
    assert.equal(isLlmConfigured(), false);
  });

  it("getLlmProviderLabel detects Groq base URL", async () => {
    process.env.LLM_API_KEY = "gsk_test_key_1234567890";
    process.env.LLM_BASE_URL = "https://api.groq.com/openai/v1";
    process.env.OPENAI_API_KEY = "";
    const { getLlmProviderLabel } = await import("@/lib/llm");
    assert.match(getLlmProviderLabel(), /Groq/i);
  });

  it("getLlmEnginesOrdered prefers Groq before OpenAI", async () => {
    process.env.GROQ_API_KEY = "gsk_test_key_1234567890";
    process.env.OPENAI_API_KEY = "sk-test-openai-key-1234567890";
    process.env.LLM_BASE_URL = "";
    const { getLlmEnginesOrdered } = await import("@/lib/llm");
    const engines = getLlmEnginesOrdered();
    assert.equal(engines.length, 2);
    assert.equal(engines[0].id, "groq");
    assert.equal(engines[1].id, "openai");
  });

  it("isLlmDisabled when OPENAI_DISABLE=true", async () => {
    process.env.OPENAI_DISABLE = "true";
    const { isLlmDisabled } = await import("@/lib/llm");
    assert.equal(isLlmDisabled(), true);
  });
});
