"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { ReactNode } from "react";

// 1. Define the exact props this component accepts
interface ScrollLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  children: ReactNode;
  href: string;
}

// 2. Apply the ScrollLinkProps type to the component
export function ScrollLink({ children, href, onClick, ...props }: ScrollLinkProps) {
  const pathname = usePathname();

  // 3. Type the MouseEvent
  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    // If the user clicks a link for the page they are currently on
    if (pathname === href) {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }

    // Preserve any other onClick behaviors passed to the component
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <Link href={href} onClick={handleScroll} {...props}>
      {children}
    </Link>
  );
}