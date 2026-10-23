"use client";

import * as React from "react";

/**
 * Sideways scroller that is a tab stop only while it overflows (keyboard users
 * need it to scroll); otherwise it'd be a redundant stop in front of its own
 * controls. Kept apart from FPSlotTable so the table stays usable from server
 * components, which can't pass its `render` functions to a client component.
 */
export function FPScrollRegion({
  label,
  className,
  children
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const [scrollable, setScrollable] = React.useState(false);
  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const update = () => setScrollable(el.scrollWidth > el.clientWidth + 1);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={scrollerRef}
      role={scrollable ? "region" : undefined}
      aria-label={scrollable ? label : undefined}
      tabIndex={scrollable ? 0 : undefined}
      className={className}
    >
      {children}
    </div>
  );
}
