import { BadgeCheck, Pill, ShieldCheck, Stethoscope, Truck, Users } from "lucide-react";

const ITEMS = [
  { icon: BadgeCheck, label: "Genuine medicines" },
  { icon: ShieldCheck, label: "Licensed pharmacist" },
  { icon: Users, label: "Pharmacist hiring network" },
  { icon: Stethoscope, label: "Doctor collaborations" },
  { icon: Truck, label: "Verified distributors" },
  { icon: Pill, label: "Medicine intelligence" },
];

export default function TrustMarquee() {
  const row = [...ITEMS, ...ITEMS];
  return (
    <div className="border-y border-ink-200/60 bg-white/70 py-5 backdrop-blur" aria-hidden="true">
      <div className="mask-fade-x overflow-hidden">
        <div className="flex w-max animate-marquee gap-10 hover:[animation-play-state:paused]">
          {row.map((item, i) => (
            <span key={i} className="flex items-center gap-2.5 whitespace-nowrap text-sm font-semibold text-ink-500">
              <item.icon className="h-4 w-4 text-brand-600" />
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
