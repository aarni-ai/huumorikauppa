import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CHRISTMAS_DEADLINE_PATH,
  CHRISTMAS_DEADLINE_PROMISE,
  isBeforeChristmasDeadline,
} from "@/data/christmas";

/**
 * Joulun tilauspäivän banneri koko sivustolle 20.11.2026 klo 23.59 (Suomen aikaa) asti.
 * Renderöidään vain selaimessa: ensimmäinen render ja esirenderöity HTML eivät sisällä banneria,
 * joten staattiseen HTML:ään ei jää vanhentunutta tilaa. Päivämäärä tarkistetaan mountissa.
 */
export function ChristmasDeadlineBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(isBeforeChristmasDeadline(Date.now()));
  }, []);

  if (!visible) return null;

  return (
    <div className="bg-primary text-primary-foreground text-center text-xs md:text-sm px-4 py-2" role="note">
      <span>Joulutilaukset: {CHRISTMAS_DEADLINE_PROMISE} </span>
      <Link to={CHRISTMAS_DEADLINE_PATH} className="underline font-semibold whitespace-nowrap">
        Lue lisää
      </Link>
    </div>
  );
}
