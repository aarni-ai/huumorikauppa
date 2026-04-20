import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    // TikTok Pixel: track SPA pageviews
    const ttq = (window as unknown as { ttq?: { page: () => void } }).ttq;
    if (ttq && typeof ttq.page === "function") {
      ttq.page();
    }
  }, [pathname]);

  return null;
}
