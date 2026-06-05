import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth-options";
import { BookingsService } from "@/services/bookings.service";
import { PrintReceiptButton } from "./PrintReceiptButton";
import ReceiptTracker from "@/components/analytics/ReceiptTracker";

export default async function BookingReceiptPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  let invoice;
  try {
    invoice = await BookingsService.getInvoice(
      code,
      session.user.id,
      session.user.role || "CLIENT"
    );
  } catch {
    redirect("/profile");
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-6 print:bg-white print:py-0">
      <ReceiptTracker code={code} />
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8 print:hidden">
          <Link
            href="/profile"
            className="text-xs font-black uppercase tracking-widest text-gray-500 hover:text-orange-600"
          >
            ← Retour au profil
          </Link>
          <PrintReceiptButton />
        </div>

        <article
          id="receipt"
          className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 print:shadow-none print:border-0 print:rounded-none"
        >
          <header className="border-b border-gray-100 pb-8 mb-8">
            <p className="text-[10px] font-black uppercase tracking-widest text-orange-600 mb-2">
              MaghrebVoyage
            </p>
            <h1 className="text-2xl font-black text-[#0F172A]">Reçu de réservation</h1>
            <p className="text-xs font-bold text-gray-400 mt-2">
              Code {invoice.confirmationCode} · Émis le {invoice.issuedAt}
            </p>
          </header>

          <section className="space-y-6 text-sm">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                Voyage
              </p>
              <p className="font-black text-[#0F172A]">{invoice.tripTitle}</p>
              <p className="text-gray-500 font-bold text-xs mt-1">
                {invoice.destination} · {invoice.dates}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                  Client
                </p>
                <p className="font-bold">{invoice.clientName}</p>
                <p className="text-xs text-gray-500">{invoice.clientEmail}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                  Agence
                </p>
                <p className="font-bold">{invoice.agencyName}</p>
              </div>
            </div>
            <table className="w-full text-left border-collapse">
              <tbody>
                <tr className="border-t border-gray-50">
                  <td className="py-3 text-gray-500 font-bold">Passagers</td>
                  <td className="py-3 text-right font-black">{invoice.seats}</td>
                </tr>
                <tr className="border-t border-gray-50">
                  <td className="py-3 text-gray-500 font-bold">Acompte versé</td>
                  <td className="py-3 text-right font-black">{invoice.depositPaid}</td>
                </tr>
                <tr className="border-t border-gray-50">
                  <td className="py-3 text-gray-500 font-bold">Montant total du voyage</td>
                  <td className="py-3 text-right font-black">{invoice.totalAmount}</td>
                </tr>
                <tr className="border-t border-gray-100">
                  <td className="py-3 font-black">Statut</td>
                  <td className="py-3 text-right font-black text-orange-600">
                    {invoice.statusLabel}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <footer className="mt-10 pt-6 border-t border-gray-100 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            Document informatif — solde restant à régler selon les conditions de
            l&apos;agence. Pour toute question : contact@maghrebvoyage.com
          </footer>
        </article>
      </div>
    </div>
  );
}
