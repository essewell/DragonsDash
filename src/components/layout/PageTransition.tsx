"use client";

import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useState, useRef } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

/**
 * Wraps page content with a subtle fade + slide-up transition
 * on route changes. Uses CSS animations for performance.
 */
export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [animState, setAnimState] = useState<"enter" | "idle" | "exit">("idle");
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (prevPath.current !== pathname) {
      // Route changed — fade out, swap, fade in
      setAnimState("exit");

      const timeout = setTimeout(() => {
        setDisplayChildren(children);
        setAnimState("enter");

        const enterTimeout = setTimeout(() => {
          setAnimState("idle");
        }, 200);

        return () => clearTimeout(enterTimeout);
      }, 150);

      prevPath.current = pathname;
      return () => clearTimeout(timeout);
    } else {
      setDisplayChildren(children);
    }
  }, [pathname, children]);

  return (
    <div
      className={`
        transition-all duration-200 ease-out
        ${animState === "exit" ? "opacity-0 translate-y-1" : ""}
        ${animState === "enter" ? "opacity-100 translate-y-0" : ""}
        ${animState === "idle" ? "opacity-100 translate-y-0" : ""}
      `}
    >
      {displayChildren}
    </div>
  );
}
