import { useEffect } from "react";
import { Navigate } from "react-router-dom";

/**
 * 301-style redirect from old /aitienpaiva-lahjat to new canonical /aitienpaiva.
 * Vercel middleware can be configured for true 301 at edge, but in SPA context
 * this also tells search engines via canonical + immediate client redirect.
 */
const MothersDayRedirect = () => {
  useEffect(() => {
    // Set status hint for prerender
    if (typeof document !== "undefined") {
      const meta = document.createElement("meta");
      meta.name = "prerender-status-code";
      meta.content = "301";
      document.head.appendChild(meta);

      const headerMeta = document.createElement("meta");
      headerMeta.name = "prerender-header";
      headerMeta.content = "Location: https://huumorikauppa.fi/aitienpaiva";
      document.head.appendChild(headerMeta);

      return () => {
        meta.remove();
        headerMeta.remove();
      };
    }
  }, []);

  return <Navigate to="/aitienpaiva" replace />;
};

export default MothersDayRedirect;
