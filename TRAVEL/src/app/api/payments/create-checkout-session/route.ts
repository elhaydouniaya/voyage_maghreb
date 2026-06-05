/**
 * CDC Module H — route officielle Stripe Checkout (délègue à bookings/initiate).
 */
import { POST as initiateBooking } from "@/app/api/bookings/initiate/route";

export async function POST(request: Request) {
  return initiateBooking(request);
}
