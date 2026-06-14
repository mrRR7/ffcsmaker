"use client";

import { useEffect, useState } from "react";
import { cn } from "@/utils/cn";

export type ConstraintSectionDef = {
  id: string;
  label: string;
  icon: React.ReactNode;
};

export function ConstraintSectionNav({
  sections
}: {
  sections: ConstraintSectionDef[];
}) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id || "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          visibleEntries.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
          setActiveId(visibleEntries[0].target.id);
        }
      },
      {
        rootMargin: "-20% 0px -60% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1]
      }
    );

    sections.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  function handleClick(id: string) {
    const el = document.getElementById(id);
    if (el) {
      // Offset by roughly a header's height so it's not flush with the top
      const y = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }

  return (
    <nav className="sticky top-4 z-10 w-full overflow-x-auto bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2 xl:bg-transparent xl:py-0 border-b border-border xl:border-none mb-4 xl:mb-0">
      <div className="flex gap-2 xl:flex-col xl:gap-1 min-w-max xl:min-w-0 px-2 xl:px-0 pb-2 xl:pb-0">
        {sections.map((section) => {
          const isActive = activeId === section.id;
          return (
            <button
              key={section.id}
              onClick={() => handleClick(section.id)}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap rounded-full xl:rounded-md px-4 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground xl:bg-primary/10 xl:text-white"
                  : "bg-secondary/40 text-muted-foreground hover:bg-secondary/60 hover:text-foreground xl:bg-transparent"
              )}
            >
              <span className="xl:hidden">{section.icon}</span>
              <span className="hidden xl:inline-block opacity-70">
                {section.icon}
              </span>
              {section.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
