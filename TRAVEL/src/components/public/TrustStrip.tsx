import { ShieldCheck, Bot, CreditCard, MapPin } from "lucide-react";

const items = [
  { icon: ShieldCheck, label: "Agences vérifiées" },
  { icon: Bot, label: "Matching IA" },
  { icon: CreditCard, label: "Paiement Stripe" },
  { icon: MapPin, label: "Maghreb expert" },
];

export default function TrustStrip() {
  return (
    <div className="flex flex-wrap justify-center lg:justify-start gap-3 md:gap-4 mt-10">
      {items.map(({ icon: Icon, label }) => (
        <span
          key={label}
          className="inline-flex items-center gap-2 bg-white/80 backdrop-blur border border-gray-100 text-[#0F172A] px-4 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm"
        >
          <Icon size={14} className="text-orange-600 shrink-0" />
          {label}
        </span>
      ))}
    </div>
  );
}
