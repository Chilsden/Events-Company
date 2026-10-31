import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Events Company", template: "%s | Events Company" },
  description: "Create and manage events. Local demonstration.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body>
        <a className="skip" href="#main">Skip to main content</a>
        <div className="banner" role="note">Local demonstration only — no sign-in or production security.</div>
        <header className="site-header">
          <Link href="/" className="brand">Events Company</Link>
          <nav aria-label="Main">
            <ul>
              <li><Link href="/">Dashboard</Link></li>
              <li><Link href="/events">Events</Link></li>
              <li><Link href="/events/new">New event</Link></li>
            </ul>
          </nav>
        </header>
        <main id="main" tabIndex={-1}>{children}</main>
        <footer className="site-footer">Synthetic data only. Not for real guest information.</footer>
      </body>
    </html>
  );
}
