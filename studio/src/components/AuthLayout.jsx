import { Link } from "react-router-dom";

// DiffWeave brand mark (replaces DocWeave logo)
function DiffWeaveMark() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="36" height="36" rx="8" fill="url(#dw-grad)" />
      <path d="M10 18 L14 12 L18 18 L22 10 L26 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="26" cy="24" r="3" fill="white" opacity="0.8"/>
      <defs>
        <linearGradient id="dw-grad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10B981"/>
          <stop offset="1" stopColor="#059669"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export function AuthLayout({ eyebrow, title, subtitle, children, footer }) {
  return (
    <div className="dw-auth">
      <div className="dw-auth__panel">
        <div className="dw-auth__brand">
          <DiffWeaveMark />
          <span className="dw-auth__wordmark">DiffWeave</span>
          <span className="dw-auth__by">by DocWeave</span>
        </div>

        <div className="dw-auth__card">
          {eyebrow && <span className="dw-auth__eyebrow">{eyebrow}</span>}
          <h1 className="dw-auth__title">{title}</h1>
          {subtitle && <p className="dw-auth__subtitle">{subtitle}</p>}
          <div className="dw-auth__body">{children}</div>
        </div>

        {footer && <div className="dw-auth__footer">{footer}</div>}
      </div>

      <div className="dw-auth__aside" aria-hidden="true">
        <div className="dw-auth__aside-grid" />
        <div className="dw-auth__aside-copy">
          <span className="dw-auth__tagline-line">AI proposes.</span>
          <span className="dw-auth__tagline-line">Rules validate.</span>
          <span className="dw-auth__tagline-line">Humans decide.</span>
          <span className="dw-auth__tagline-line dw-auth__tagline-line--accent">Knowledge commits.</span>
        </div>
      </div>
    </div>
  );
}