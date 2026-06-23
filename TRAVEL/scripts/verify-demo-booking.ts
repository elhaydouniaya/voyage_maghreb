/**
 * End-to-end booking initiate (authenticated client).
 * Usage: npx tsx scripts/verify-demo-booking.ts [baseUrl]
 */
const base = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");

async function getCsrf() {
  const res = await fetch(`${base}/api/auth/csrf`);
  const data = await res.json();
  const cookie = res.headers.get("set-cookie") || "";
  return { csrfToken: data.csrfToken, cookie };
}

async function signIn(email: string, password: string) {
  const { csrfToken, cookie: csrfCookie } = await getCsrf();
  const body = new URLSearchParams({
    csrfToken,
    email,
    password,
    json: "true",
  });

  const res = await fetch(`${base}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: csrfCookie.split(";")[0] || "",
    },
    body,
    redirect: "manual",
  });

  const setCookie = res.headers.getSetCookie?.() || [];
  return setCookie.map((c) => c.split(";")[0]).filter(Boolean).join("; ");
}

async function main() {
  console.log(`\n=== Booking initiate E2E (${base}) ===\n`);

  const tripsRes = await fetch(`${base}/api/trips`);
  const tripsData = (await tripsRes.json()) as {
    trips?: { id: string; title: string; totalSpots: number; bookedSpots: number }[];
  };
  const trip = tripsData.trips?.find((t) => t.totalSpots - t.bookedSpots > 0);
  if (!trip) {
    console.error("FAIL — no trip with available spots");
    process.exit(1);
  }
  console.log(`Trip: ${trip.title} (${trip.id})`);

  const cookie = await signIn("client@test.com", "client123");
  if (!cookie) {
    console.error("FAIL — could not sign in");
    process.exit(1);
  }
  console.log("Signed in as client@test.com");

  const initiateRes = await fetch(`${base}/api/bookings/initiate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      groupTripId: trip.id,
      clientName: "Jean Testeur",
      clientPhone: "+33600000000",
      clientCountry: "France",
      numberOfSeats: 1,
      acceptCgu: true,
      acceptRgpd: true,
    }),
  });
  const initiateData = (await initiateRes.json()) as {
    bookingId?: string;
    checkoutUrl?: string;
    demoMode?: boolean;
    booking?: { confirmationCode?: string; status?: string };
    error?: string;
  };

  if (!initiateRes.ok) {
    if (initiateRes.status === 429) {
      console.log("SKIP initiate — rate limited (endpoint reachable, try again later)");
      process.exit(0);
    }
    console.error(`FAIL initiate — HTTP ${initiateRes.status}: ${initiateData.error}`);
    process.exit(1);
  }

  const bookingId = initiateData.bookingId;
  if (!bookingId) {
    console.error("FAIL — no bookingId in response");
    process.exit(1);
  }

  if (initiateData.checkoutUrl) {
    console.log("PASS initiate — Stripe checkout URL returned (Stripe mode)");
    process.exit(0);
  }

  if (!initiateData.demoMode || !initiateData.booking?.confirmationCode) {
    console.error("FAIL — expected demoMode booking confirmation");
    process.exit(1);
  }
  console.log(
    `PASS initiate — demo confirmed ${initiateData.booking.confirmationCode} (${initiateData.booking.status})`
  );

  const lookupRes = await fetch(
    `${base}/api/bookings/lookup?bookingId=${encodeURIComponent(bookingId)}`,
    { headers: { Cookie: cookie } }
  );
  const lookupData = (await lookupRes.json()) as {
    booking?: { confirmationCode?: string; status?: string };
    emailSent?: boolean;
    emailTo?: string;
    error?: string;
  };

  if (!lookupRes.ok || lookupData.booking?.status !== "CONFIRMED") {
    console.error(`FAIL lookup — ${lookupData.error || lookupRes.status}`);
    process.exit(1);
  }
  console.log(
    `PASS lookup — ${lookupData.booking.confirmationCode}, emailSent=${lookupData.emailSent}, to=${lookupData.emailTo || "n/a"}`
  );

  console.log("\nBooking initiate E2E: ALL PASSED\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
