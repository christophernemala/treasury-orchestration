import React from "react";

interface LogoProps {
  size?: number;
  showText?: boolean;
  textColor?: string;
  className?: string;
}

export function TreasuryAtomLogo({
  size = 28,
  showText = true,
  textColor = "#FFFFFF",
  className = "",
}: LogoProps) {
  return (
    <div
      className={`treasury-atom-brand ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "10px",
        textDecoration: "none",
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="atomGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E9D7B8" />
            <stop offset="50%" stopColor="#C3A77B" />
            <stop offset="100%" stopColor="#8C6D3F" />
          </linearGradient>
          <filter id="atomGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Orbit 1 */}
        <ellipse
          cx="20"
          cy="20"
          rx="17"
          ry="6.5"
          transform="rotate(-28 20 20)"
          stroke="url(#atomGoldGrad)"
          strokeWidth="1.75"
          fill="none"
          opacity="0.9"
          filter="url(#atomGlow)"
        />

        {/* Outer Orbit 2 */}
        <ellipse
          cx="20"
          cy="20"
          rx="17"
          ry="6.5"
          transform="rotate(32 20 20)"
          stroke="url(#atomGoldGrad)"
          strokeWidth="1.75"
          fill="none"
          opacity="0.8"
        />

        {/* Center Nucleus / Node */}
        <circle cx="20" cy="20" r="2.75" fill="#C3A77B" />
        <circle cx="20" cy="20" r="1.5" fill="#FFF5E6" />
      </svg>

      {showText && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.14em",
              color: textColor,
              textTransform: "uppercase",
              lineHeight: 1.1,
            }}
          >
            Treasury Atom
          </span>
        </div>
      )}
    </div>
  );
}
