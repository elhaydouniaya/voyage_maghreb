import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parseProgramDays,
  splitProgramAndCancelPolicy,
} from "@/lib/program-days";

describe("program-days", () => {
  it("splits cancel policy from program text", () => {
    const result = splitProgramAndCancelPolicy(
      "Jour 1: Arrivée\n\n--- Politique d'annulation ---\nRemboursement 30j"
    );
    assert.equal(result.programText, "Jour 1: Arrivée");
    assert.equal(result.cancelPolicy, "Remboursement 30j");
  });

  it("parses day lines into timeline items", () => {
    const items = parseProgramDays(
      "Jour 1: Arrivée et accueil. Transfert hôtel.\nJour 2: Exploration"
    );
    assert.equal(items.length, 2);
    assert.equal(items[0].day, "Jour 1");
    assert.equal(items[0].title, "Arrivée et accueil");
    assert.equal(items[0].desc, "Transfert hôtel.");
  });
});
