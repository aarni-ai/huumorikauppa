/**
 * Palautuminen vanhentuneista JavaScript-paloista julkaisun jälkeen.
 *
 * Jos selain saa vanhan HTML:n (CDN-välimuisti julkaisun hetkellä), se viittaa edellisen
 * julkaisun hajautettuihin /assets/-tiedostoihin, joita uudessa julkaisussa ei ole. Silloin
 * sovelluksen entry tai sivun lazy-chunk ei lataudu. Sivu ladataan uudelleen kerran; jos
 * edellisestä uudelleenlatauksesta on alle CHUNK_RELOAD_MIN_INTERVAL_MS, ei ladata uudelleen
 * (ei silmukkaa), vaan kutsuja näyttää varasisällön.
 *
 * Sama logiikka on ES5-muodossa esirenderöidyn HTML:n inline-vahdissa (bootGuardScript,
 * src/seo/prerender/html.ts), koska entryn epäonnistuessa tämä moduuli ei ole käytettävissä.
 */
export const CHUNK_RELOAD_KEY = "hk-chunk-reload";
export const CHUNK_RELOAD_MIN_INTERVAL_MS = 60_000;

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function sessionStorageOrNull(): StorageLike | null {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

/** Lataa sivun uudelleen, jos se on sallittua. Palauttaa true, jos uudelleenlataus käynnistettiin. */
export function reloadOnceForStaleChunk(
  storage: StorageLike | null = sessionStorageOrNull(),
  now: number = Date.now(),
  reload: () => void = () => window.location.reload(),
): boolean {
  // Ilman sessionStoragea silmukkaa ei voi estää: ei ladata uudelleen.
  if (!storage) return false;
  try {
    const last = Number(storage.getItem(CHUNK_RELOAD_KEY)) || 0;
    if (now - last < CHUNK_RELOAD_MIN_INTERVAL_MS) return false;
    storage.setItem(CHUNK_RELOAD_KEY, String(now));
  } catch {
    return false;
  }
  reload();
  return true;
}
