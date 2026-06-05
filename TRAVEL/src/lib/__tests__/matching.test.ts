import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isQualifiedMatch,
  isFallbackMatch,
  MATCH_MIN_SCORE,
} from "@/lib/matching-config";

describe("matching-config", () => {
  it("isQualifiedMatch accepts score at CDC threshold", () => {
    assert.equal(isQualifiedMatch({ score: MATCH_MIN_SCORE, compatibility: 33 }), true);
    assert.equal(isQualifiedMatch({ score: 5, compatibility: 33 }), false);
    assert.equal(isQualifiedMatch({ score: 0, compatibility: 40 }), true);
  });

  it("isFallbackMatch detects CDC fallback rows", () => {
    assert.equal(
      isFallbackMatch({
        score: 0,
        compatibility: 0,
        reasons: ["Prochain départ disponible"],
      }),
      true
    );
    assert.equal(
      isFallbackMatch({ score: 8, compatibility: 44, reasons: ["Destination"] }),
      false
    );
  });
});
