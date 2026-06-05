import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { TravelRequestsService } from "@/services/travel-requests.service";

describe("TravelRequestsService.statusLabel", () => {
  it("maps known statuses to French labels", () => {
    assert.equal(TravelRequestsService.statusLabel("MATCH_SUGGESTED"), "Correspondances trouvées");
    assert.equal(TravelRequestsService.statusLabel("PAYMENT_PENDING"), "Paiement en cours");
    assert.equal(TravelRequestsService.statusLabel("PAID"), "Acompte payé");
  });

  it("returns raw status for unknown values", () => {
    assert.equal(TravelRequestsService.statusLabel("CUSTOM"), "CUSTOM");
  });
});
