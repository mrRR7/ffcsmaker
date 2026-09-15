"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { pageFade } from "@/utils/motion";

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname?.startsWith("/new")) {
    return <>{children}</>;
  }

  return (
    <motion.div
      variants={pageFade}
      initial="initial"
      animate="animate"
      // Exit animations in Next.js app router require AnimatePresence in layout,
      // but simple mount animation on template works great.
    >
      {children}
    </motion.div>
  );
}
