/* ProtectMe AI — shared UI primitives (Icon, Button, Pill, SeverityBadge) */
/* React hooks (useState, useEffect, useRef, …) are exposed as globals in index.html */

/* ---- Lucide icon as a React component (UMD build, no lucide-react) ---------- */
function toPascal(name) {
  return name.split("-").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join("");
}
function Icon({ name, size = 18, strokeWidth = 1.75, className, style, color }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !window.lucide) return;
    const pascal = toPascal(name);
    const node = (window.lucide.icons && window.lucide.icons[pascal]) || window.lucide[pascal];
    el.innerHTML = "";
    if (node && window.lucide.createElement) {
      const svg = window.lucide.createElement(node);
      svg.setAttribute("width", size);
      svg.setAttribute("height", size);
      svg.setAttribute("stroke-width", strokeWidth);
      el.appendChild(svg);
    }
  }, [name, size, strokeWidth]);
  return (
    <span
      ref={ref}
      aria-hidden="true"
      className={className}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", color, lineHeight: 0, ...style }}
    />
  );
}

/* ---- Button ----------------------------------------------------------------- */
function Button({ variant = "primary", size, onDark, onLight, icon, iconRight, children, className = "", ...rest }) {
  const cls = [
    "btn",
    `btn-${variant}`,
    size === "sm" ? "btn-sm" : size === "lg" ? "btn-lg" : "",
    onDark ? "on-dark" : "",
    onLight ? "on-light" : "",
    className,
  ].filter(Boolean).join(" ");
  return (
    <button className={cls} {...rest}>
      {icon && <Icon name={icon} size={size === "sm" ? 15 : 17} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === "sm" ? 15 : 17} />}
    </button>
  );
}

/* ---- Icon-only button ------------------------------------------------------- */
function IconButton({ icon, label, className = "", size = 18, ...rest }) {
  return (
    <button className={`btn btn-secondary btn-icon ${className}`} aria-label={label} title={label} {...rest}>
      <Icon name={icon} size={size} />
    </button>
  );
}

/* ---- Severity badge (color + icon + label, never color alone) --------------- */
function SeverityBadge({ severity, label }) {
  const meta = SEVERITY[severity];
  return (
    <span className={`pill pill-${severity}`}>
      <Icon name={meta.icon} size={14} />
      {label || `${meta.label} risk`}
    </span>
  );
}

/* ---- Voice status dot ------------------------------------------------------- */
function VoiceDot({ color, live }) {
  return (
    <span
      className={live ? "vdot vdot-live" : "vdot"}
      style={{ background: color }}
    />
  );
}

Object.assign(window, { Icon, Button, IconButton, SeverityBadge, VoiceDot, toPascal });
