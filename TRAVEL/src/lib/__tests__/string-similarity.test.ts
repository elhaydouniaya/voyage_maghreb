import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { destinationsMatch, levenshtein } from "@/lib/string-similarity";

describe("string-similarity", () => {
  it("levenshtein returns 0 for identical strings", () => {
    assert.equal(levenshtein("marrakech", "marrakech"), 0);
  });

  it("destinationsMatch tolerates minor typos (CDC)", () => {
    assert.equal(destinationsMatch("Marrakech, Maroc", "marrakech"), true);
    assert.equal(destinationsMatch("Tassili N'Ajjer", "tassili"), true);
  });
});
