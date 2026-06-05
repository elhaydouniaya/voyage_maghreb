import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  bookingInitiateSchema,
  aiMatchSchema,
  guideChatPostSchema,
} from "../api-schemas";

describe("api-schemas", () => {
  it("bookingInitiateSchema requires trip id and consents", () => {
    const ok = bookingInitiateSchema.safeParse({
      groupTripId: "trip1",
      clientEmail: "a@b.com",
      clientName: "Ali",
      acceptCgu: true,
      acceptRgpd: true,
    });
    assert.equal(ok.success, true);

    const bad = bookingInitiateSchema.safeParse({
      clientEmail: "a@b.com",
      clientName: "Ali",
      acceptCgu: false,
      acceptRgpd: true,
    });
    assert.equal(bad.success, false);
  });

  it("aiMatchSchema accepts flexible matching payload", () => {
    const ok = aiMatchSchema.safeParse({
      destination: "Sahara",
      budgetMax: 1500,
      extraField: true,
    });
    assert.equal(ok.success, true);
  });

  it("guideChatPostSchema validates messages", () => {
    const ok = guideChatPostSchema.safeParse({
      messages: [{ role: "user", content: "Bonjour" }],
    });
    assert.equal(ok.success, true);
  });
});
