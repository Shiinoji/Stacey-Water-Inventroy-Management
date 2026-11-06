import { Droplets } from "lucide-react";

export function Logo({ businessName }) {
  return (
    <a className="brand" href="#" aria-label={`${businessName} home`}>
      <span className="brand-mark"><Droplets size={20} strokeWidth={2.2} /></span>
      <span>{businessName}</span>
    </a>
  );
}

// Renders the app's shared button styles while forwarding native button props.

export function Button({ children, variant = "primary", className = "", ...props }) {
  return <button className={`button button-${variant} ${className}`} {...props}>{children}</button>;
}

// Displays a labeled metric with its icon and color treatment.

export function MetricCard({ label, value, icon: Icon, tone = "blue" }) {
  return (
    <article className="metric-card">
      <div className={`metric-icon metric-${tone}`}><Icon size={19} /></div>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
    </article>
  );
}

// Displays a short status label with a visual status color.

export function StatusPill({ children, kind = "green" }) {
  return <span className={`status-pill status-${kind}`}>{children}</span>;
}

// Shows a consistent message when a section has no content to display.

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><Icon size={24} /></span>
      <strong>{title}</strong>
      <span>{text}</span>
      {action}
    </div>
  );
}

// Owns workspace state and routes the selected page to its content component.

export function PageHeading({ eyebrow, title, description, children }) {
  return (
    <div className="page-heading">
      <div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>
      {children && <div className="heading-actions">{children}</div>}
    </div>
  );
}

// The dashboard highlights current totals and recent transaction activity.
