import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Polymath Engine — Second Brain for Real Life",
  description: "AI-powered knowledge synthesis that transforms scattered daily inputs into connected visual mind maps, sharper decisions, and the right support exactly when needed.",
};

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "🧠" },
  { href: "/power-brain", label: "Power Brain", icon: "⚡" },
  { href: "/ingest", label: "Feed input", icon: "📥" },
  { href: "/sketch", label: "Sketch first", icon: "✏️" },
  { href: "/decision", label: "Decision lab", icon: "⚖️" },
  { href: "/community", label: "Community", icon: "🗺️" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-polymath-bg text-polymath-text min-h-screen">
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <nav className="w-56 bg-polymath-surface border-r border-polymath-border p-4 flex flex-col shrink-0">
            <div className="mb-8">
              <h1 className="text-lg font-semibold text-white">Polymath</h1>
              <p className="text-xs text-polymath-muted mt-1">Second Brain Engine</p>
            </div>

            <div className="space-y-1 flex-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-polymath-muted hover:text-polymath-text hover:bg-polymath-bg transition-colors"
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Mastery tracker (gamification) */}
            <div className="mt-auto pt-4 border-t border-polymath-border">
              <div className="flex items-center justify-between text-xs text-polymath-muted mb-2">
                <span>Daily streak</span>
                <span className="text-polymath-teal font-medium">7 days</span>
              </div>
              <div className="w-full bg-polymath-bg rounded-full h-1.5">
                <div
                  className="bg-polymath-teal h-1.5 rounded-full transition-all"
                  style={{ width: "70%" }}
                />
              </div>
              <p className="text-xs text-polymath-muted mt-1.5">
                3 more days to unlock Systems Thinking badge
              </p>
            </div>
          </nav>

          {/* Main content */}
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
