import { Truck } from "lucide-react";

/**
 * Delivery-time notice for dropship (AliExpress) products. Printify products keep
 * their fast time shown elsewhere, so this renders only for AliExpress items.
 */
export function DeliveryBadge({ supplier, className = "" }: { supplier?: string; className?: string }) {
  if (supplier !== "aliexpress") return null;
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 ${className}`}
    >
      <Truck className="h-3.5 w-3.5 shrink-0" />
      Toimitusaika n. 2–4 vk · toimitetaan erikseen
    </div>
  );
}
