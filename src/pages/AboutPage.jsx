import { Droplets, PackageCheck, ShieldCheck } from "lucide-react";
import { PageHeading } from "../components/Common.jsx";

export function AboutPage({ businessName }) {
  return (
    <div className="about-page">
      <PageHeading
        eyebrow="ABOUT THIS WORKSPACE"
        title={`About ${businessName}`}
        description="A simple workspace for keeping water-container inventory and delivery activity organized."
      />

      <section className="panel about-intro">
        <span className="about-brand-mark"><Droplets size={26} /></span>
        <div>
          <h2>{businessName} Inventory Management</h2>
          <p>
            Manage deliveries from the moment containers are issued through delivery confirmation.
            Keep your team, container types, delivery areas, and sales activity together in one place.
          </p>
        </div>
      </section>

      <section className="about-feature-grid" aria-label="Workspace features">
        <article className="panel about-feature">
          <span className="about-feature-icon"><PackageCheck size={20} /></span>
          <h2>Track deliveries</h2>
          <p>Record container movements and confirm pending deliveries with returned, damaged, and lost quantities.</p>
        </article>
        <article className="panel about-feature">
          <span className="about-feature-icon"><ShieldCheck size={20} /></span>
          <h2>Your workspace data</h2>
          <p>Records are saved in this browser. Export a backup from Settings to keep a portable copy of your workspace.</p>
        </article>
      </section>
    </div>
  );
}
