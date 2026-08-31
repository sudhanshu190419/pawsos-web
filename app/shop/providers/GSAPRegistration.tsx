"use client";

import { useEffect, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let isRegistered = false;

export default function GSAPRegistration({
  children,
}: {
  children?: ReactNode;
}) {
  useEffect(() => {
    if (!isRegistered && typeof window !== "undefined") {
      gsap.registerPlugin(ScrollTrigger);
      isRegistered = true;
    }
  }, []);

  return children ? <>{children}</> : null;
}
