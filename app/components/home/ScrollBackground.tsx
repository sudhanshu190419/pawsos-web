"use client";

import { useEffect } from "react";

export default function ScrollBackground() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const bgColor = entry.target.getAttribute("data-bg-color");
            const wrapper = document.getElementById("home-main-wrapper");
            if (wrapper && bgColor) {
              // Remove existing background classes
              wrapper.classList.remove("bg-[#FDF8F3]", "bg-[#1C1614]", "bg-[#446464]");
              // Add the matching background class
              wrapper.classList.add(bgColor);
            }
          }
        });
      },
      {
        threshold: 0,
        rootMargin: "-45% 0px -45% 0px",
      }
    );

    const sections = document.querySelectorAll("[data-bg-color]");
    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, []);

  return null;
}
