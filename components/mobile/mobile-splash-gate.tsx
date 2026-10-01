"use client";

import { useEffect, useState } from "react";
import BrandLogo from "@/components/ui/brand-logo";
import {
  getBrowserStorage,
  readTextStorage,
  writeTextStorage,
} from "@/lib/client/browser-storage";

const SPLASH_DURATION_MS = 850;

export default function MobileSplashGate() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 760px)").matches;
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    const storage = getBrowserStorage("session");
    const alreadyShown =
      readTextStorage("binso:splash:shown", "", storage) === "1";

    if (!mobile || !standalone || alreadyShown) {
      return;
    }

    writeTextStorage("binso:splash:shown", "1", storage);

    let hideTimer: number | undefined;
    const showFrame = window.requestAnimationFrame(() => {
      setVisible(true);
      hideTimer = window.setTimeout(() => {
        setVisible(false);
      }, SPLASH_DURATION_MS);
    });

    return () => {
      window.cancelAnimationFrame(showFrame);
      if (hideTimer !== undefined) {
        window.clearTimeout(hideTimer);
      }
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className="mobile-splash" role="status" aria-label="Binso One">
      <div className="mobile-splash-mark">
        <BrandLogo compact />
      </div>
      <strong>Binso One</strong>
    </div>
  );
}
