import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { merkitseSiirtyma } from "@/lib/laskeutuminen";

export function ScrollToTop() {
  const { pathname } = useLocation();
  const ensimmainen = useRef(pathname);

  useEffect(() => {
    window.scrollTo(0, 0);
    // Laskeutumisen kooste (src/lib/laskeutuminen.ts): siirtyminen toiselle sivulle = kävijä jatkoi.
    if (pathname !== ensimmainen.current) merkitseSiirtyma();
  }, [pathname]);

  return null;
}
