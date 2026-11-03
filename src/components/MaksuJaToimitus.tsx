import { Truck } from "lucide-react";
import { PaymentIcons } from "@/components/PaymentIcons";
import { TOIMITUSRIVI } from "@/config/toimitus";
import type { Maksutapa } from "@/config/maksutavat";

/**
 * Maksutapojen kuvakkeet (src/config/maksutavat.ts) ja toimitusrivi (src/config/toimitus.ts) ostopainikkeen
 * yhteyteen: tuotesivu ja ostoskori.
 */
export function MaksuJaToimitus({ className = "", center = false, tavat, toimitusrivi }: { className?: string; center?: boolean; tavat?: readonly Maksutapa[]; /** Korvaava toimitusrivi (hintatesti B: "Ilmainen toimitus"). */ toimitusrivi?: string }) {
  return (
    <div className={`space-y-1.5 text-xs text-muted-foreground ${className}`}>
      <PaymentIcons iconClassName="h-4 w-auto" className={center ? "justify-center" : ""} {...(tavat ? { tavat } : {})} />
      <p className={`flex items-center gap-1.5 ${center ? "justify-center" : ""}`}>
        <Truck className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
        <span>{toimitusrivi ?? TOIMITUSRIVI}</span>
      </p>
    </div>
  );
}
