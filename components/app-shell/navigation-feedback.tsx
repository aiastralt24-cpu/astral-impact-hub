"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function NavigationFeedbackInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    setNavigating(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      if (`${destination.pathname}${destination.search}` === `${window.location.pathname}${window.location.search}`) return;
      setNavigating(true);
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  useEffect(() => {
    if (!navigating) return;
    const safetyTimer = window.setTimeout(() => setNavigating(false), 12000);
    return () => window.clearTimeout(safetyTimer);
  }, [navigating]);

  return (
    <div
      className={`navigation-progress ${navigating ? "navigation-progress--active" : ""}`}
      role="progressbar"
      aria-label="Loading page"
      aria-hidden={!navigating}
    >
      <span />
    </div>
  );
}

export function NavigationFeedback() {
  return <Suspense fallback={null}><NavigationFeedbackInner /></Suspense>;
}
