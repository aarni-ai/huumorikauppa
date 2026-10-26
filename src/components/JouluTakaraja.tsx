import { useMemo, useSyncExternalStore } from "react";
import { Gift } from "lucide-react";
import { aktiivinenJouluTakaraja, jouluRivi, type JouluTakaraja } from "@/data/jouluAikataulu";

/** setTimeoutin yläraja (noin 24,8 vrk). */
const MAX_TIMEOUT_MS = 2_147_483_647;

/** Herättää komponentin, kun takaraja menee umpeen sivun ollessa auki. */
function subscribeUntil(endMs: number | null) {
  return (onChange: () => void) => {
    if (endMs === null) return () => {};
    let timer: ReturnType<typeof setTimeout>;
    const arm = () => {
      const left = endMs + 1 - Date.now();
      if (left <= 0) return;
      timer = setTimeout(() => {
        onChange();
        arm();
      }, Math.min(left, MAX_TIMEOUT_MS));
    };
    arm();
    return () => clearTimeout(timer);
  };
}

/**
 * Varhaisin joulun takaraja annetuille kategorioille, vain selaimessa ja vain ennen takarajaa
 * (Suomen aika). Palvelin- ja esirenderöinnissä null: staattiseen HTML:ään ei jää vanhentunutta lupausta.
 */
export function useJouluTakaraja(categories: readonly (string | null | undefined)[]): JouluTakaraja | null {
  const candidate = aktiivinenJouluTakaraja(categories, 0);
  const endMs = candidate?.endUtcMs ?? null;
  const subscribe = useMemo(() => subscribeUntil(endMs), [endMs]);
  const active = useSyncExternalStore(
    subscribe,
    () => endMs !== null && Date.now() <= endMs,
    () => false,
  );
  return active ? candidate : null;
}

/** "Tilaa viimeistään pe 20.11.2026, niin ehtii jouluksi." tai ei mitään. */
export function JouluTakarajaRivi({
  categories,
  className = "",
  as: Tag = "p",
}: {
  categories: readonly (string | null | undefined)[];
  className?: string;
  as?: "p" | "li" | "span";
}) {
  const t = useJouluTakaraja(categories);
  if (!t) return null;
  return (
    <Tag className={`flex items-start gap-1.5 ${className}`} data-joulu-takaraja={t.iso}>
      <Gift className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
      <span>{jouluRivi(t)}</span>
    </Tag>
  );
}
