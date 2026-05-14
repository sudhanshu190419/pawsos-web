"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

/*
  Add to globals.css:
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');
*/

const SOCIAL_LINKS = [
  {
    label: "Instagram",
    href: "https://instagram.com/animal.sathi",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    label: "Twitter / X",
    href: "https://twitter.com/animalsathi",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: "Facebook",
    href: "https://facebook.com/animalsathi",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/company/animalsathi", 
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.5 8h4V24h-4V8zm7 0h3.8v2.2h.1c.53-1 1.84-2.2 3.8-2.2 4.06 0 4.8 2.67 4.8 6.14V24h-4v-7.4c0-1.77-.03-4.05-2.47-4.05-2.47 0-2.85 1.93-2.85 3.92V24h-4V8z"/>
      </svg>
    ),
  },
];

const NAV_COLS = [
  {
    id: "explore",
    label: "Explore",
    links: [
      { text: "Home", href: "/", badge: undefined },
      { text: "About Us", href: "/about", badge: undefined },
      { text: "How It Works", href: "/how-it-works", badge: undefined },
      { text: "Shop", href: "/shop", badge: undefined },
    ],
  },
  {
    id: "join",
    label: "Join Us",
    links: [
      { text: "Volunteer", href: "/volunteer-form", badge: undefined },
      { text: "NGO Partner", href: "/onboarding", badge: undefined },
      { text: "Register as Vet", href: "/vets", badge: undefined },
      { text: "Investors", href: "/investors", badge: "New" },
    ],
  },
];

const LEGAL_LINKS = [
  { text: "Privacy Policy", href: "/privacy" },
  { text: "Terms of Service", href: "/terms" },
  { text: "Cookie Policy", href: "/cookies" },
];

export default function Footer() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/auth") return null;
  
  return (
    <>
      <style>{`
        .as-link {
          color: #6b7280;
          font-size: 0.875rem;
          text-decoration: none;
          transition: color 0.18s ease;
          display: inline-flex;
          align-items: flex-start; /* Changed to flex-start so long text wraps nicely under itself */
          gap: 6px;
        }
        .as-link:hover { color: #f97316; }

        .as-social {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.08);
          color: #6b7280;
          text-decoration: none;
          transition: color 0.18s ease, border-color 0.18s ease, background 0.18s ease;
        }
        .as-social:hover {
          color: #f97316;
          border-color: rgba(249,115,22,0.35);
          background: rgba(249,115,22,0.08);
        }

        .as-col-label {
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #374151;
          margin-bottom: 16px;
          display: block;
        }

        @media (max-width: 768px) {
          .as-footer-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 40px 16px !important; /* Increased row gap to prevent overlap, tight column gap */
            align-items: start;
          }

          /* Force both the Brand and the Contact columns to span full width on mobile */
          .as-brand-col,
          .as-contact-col {
            grid-column: 1 / -1;
          }
        }
      `}</style>

      <footer
        style={{
          background: "#111110",
          fontFamily: "'DM Sans', sans-serif",
          overflowX: "hidden",
          width: "100%",
        }}
      >
        {/* Orange top accent line */}
        <div
          aria-hidden="true"
          style={{
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, #f97316 40%, #fdba74 60%, transparent)",
          }}
        />

        {/* Main grid */}
        <div
          className="as-footer-grid"
          style={{
            maxWidth: "1120px",
            margin: "0 auto",
            padding: "64px 20px 52px",
            display: "grid",
            gridTemplateColumns: "2.8fr 1.2fr 1.2fr 1.8fr",
            gap: "24px",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {/* Brand */}
          <div className="as-brand-col">
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                textDecoration: "none",
                marginBottom: "12px",
              }}
            >
              <span style={{ fontSize: "1.35rem" }}>🐾</span>
              <span
                style={{
                  fontSize: "1.65rem",
                  fontWeight: 600,
                  color: "#f5f5f4",
                  letterSpacing: "-0.01em",
                }}
              >
                Animal<span style={{ color: "#f97316" }}>Sathi</span>
              </span>
            </Link>

            <p
              style={{
                color: "#4b5563",
                fontSize: "0.99rem",
                lineHeight: 1.75,
                maxWidth: "260px",
                margin: "0 0 24px",
              }}
            >
              Connecting compassionate people, volunteers, and vets to rescue
              and protect animals across India.
            </p>

            <div style={{ display: "flex", gap: "8px" }}>
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="as-social"
                  aria-label={s.label}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          {NAV_COLS.map((col) => (
            <nav key={col.id} aria-labelledby={`footer-${col.id}`}>
              <span id={`footer-${col.id}`} className="as-col-label">
                {col.label}
              </span>
              <ul
                style={{
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="as-link"
                      scroll={true}
                      onClick={(e) => {
                        if (
                          pathname.replace(/\/$/, "") ===
                          link.href.replace(/\/$/, "")
                        ) {
                          e.preventDefault();
                          router.push(link.href);
                          setTimeout(() => {
                            window.scrollTo({
                              top: 0,
                              behavior: "smooth",
                            });
                          }, 50);
                        }
                      }}
                    >
                      {link.text}
                      {link.badge && (
                        <span
                          style={{
                            fontSize: "0.6rem",
                            fontWeight: 600,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            background: "rgba(249,115,22,0.15)",
                            color: "#fb923c",
                            padding: "2px 6px",
                            borderRadius: "4px",
                          }}
                        >
                          {link.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {/* Contact + App */}
          {/* ADDED .as-contact-col CLASS HERE */}
          <div className="as-contact-col">
            <span className="as-col-label">Contact</span>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                marginBottom: "24px",
              }}
            >
              <a
                href="mailto:animalbuddiessociety@gmail.com"
                className="as-link"
                style={{
                  wordBreak: "normal",
                  overflowWrap: "break-word",
                }}
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  width="14"
                  height="14"
                  style={{ flexShrink: 0, color: "#f97316", marginTop: "3px" }}
                >
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                animalbuddiessociety@gmail.com
              </a>

              <span className="as-link" style={{ cursor: "default", lineHeight: "1.5" }}>
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  width="14"
                  height="14"
                  style={{ flexShrink: 0, color: "#f97316", marginTop: "4px" }}
                >
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
                GL BAJAJ INSTITUTE OF MANAGEMENT AND RESEARCH, APJ Abdul Kalam Rd, Knowledge Park III, Greater Noida, Uttar Pradesh 201306
              </span>
            </div>

            {/* App Download Section */}
            <div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    marginTop: "8px",
    flexWrap: "nowrap",
    width: "100%",
  }}
>
              {/* Play Store Button */}
              <a
                href="https://play.google.com/store/apps/details?id=com.pawsos"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Get it on Google Play"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 16px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                  textDecoration: "none",
                  transition: "border-color 0.18s, background 0.18s",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.borderColor = "rgba(249,115,22,0.35)";
                  el.style.background = "rgba(249,115,22,0.06)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.borderColor = "rgba(255,255,255,0.08)";
                  el.style.background = "rgba(255,255,255,0.03)";
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="#f97316"
                  width="20"
                  height="20"
                >
                  <path d="M3.18 23.76a2 2 0 01-.93-.89V1.13A2 2 0 013.18.24l.1-.06 12.77 11.76v.12L3.28 23.82l-.1-.06zM17.34 15.22l-3.14-2.9 3.14-2.9 3.55 2.01a1.03 1.03 0 010 1.79l-3.55 2zM3.28.18L14.2 10.6 10.7 14 3.28.18zm10.92 13.62l-9.92 9.02L14.2 13.4l-.01.4z" />
                </svg>

                <div>
                  <p
                    style={{
                      fontSize: "0.6rem",
                      color: "#6b7280",
                      textTransform: "uppercase",
                      margin: 0,
                    }}
                  >
                    Get it on
                  </p>
                  <p
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      color: "#d1d5db",
                      margin: "3px 0 0",
                    }}
                  >
                    Google Play
                  </p>
                </div>
              </a>

              {/* QR Code */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <img
                  src="/qr-code.png"
                  alt="Scan to download"
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "12px",
                    background: "#fff",
                    padding: "6px",
                  }}
                />
                <span
                  style={{
                    fontSize: "0.65rem",
                    color: "#6b7280",
                  }}
                >
                  Scan to Download
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Legal bar */}
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.05)",
            maxWidth: "1120px",
            margin: "0 auto",
            padding: "18px 24px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <p style={{ fontSize: "0.78rem", color: "#374151", margin: 0 }}>
            © {new Date().getFullYear()} AnimalSathi · Made with 🧡 for animals
            across India
          </p>

          <nav aria-label="Legal">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
              {LEGAL_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="as-link"
                  onClick={(e) => {
                    if (
                      pathname.replace(/\/$/, "") ===
                      l.href.replace(/\/$/, "")
                    ) {
                      e.preventDefault();
                      router.push(l.href);
                      setTimeout(() => {
                        window.scrollTo({
                          top: 0,
                          behavior: "smooth",
                        });
                      }, 50);
                    }
                  }}
                >
                  {l.text}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </footer>
    </>
  );
}