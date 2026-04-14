import Link from "next/link";
import "./docs.css";

const sections = [
  {
    label: "Overview",
    items: [{ title: "Getting Started", href: "/docs" }],
  },
  {
    label: "Commands",
    items: [
      {
        title: "Bridge",
        href: "/docs/bridge",
        children: [
          { title: "lifi bridge", href: "/docs/bridge#usage" },
          { title: "Options", href: "/docs/bridge#options" },
          { title: "Examples", href: "/docs/bridge#examples" },
        ],
      },
      {
        title: "Swap",
        href: "/docs/swap",
        children: [
          { title: "lifi swap", href: "/docs/swap#usage" },
          { title: "Options", href: "/docs/swap#options" },
        ],
      },
      {
        title: "Earn",
        href: "/docs/earn",
        children: [
          { title: "lifi earn quote", href: "/docs/earn#quote" },
          { title: "lifi earn protocols", href: "/docs/earn#protocols" },
        ],
      },
      {
        title: "Markets",
        href: "/docs/markets",
        children: [
          { title: "lifi markets list", href: "/docs/markets#list" },
          { title: "lifi markets get", href: "/docs/markets#get" },
        ],
      },
      {
        title: "Kalshi",
        href: "/docs/kalshi",
      },
      {
        title: "Manifold",
        href: "/docs/manifold",
      },
      {
        title: "Wallet",
        href: "/docs/wallet",
        children: [
          { title: "lifi wallet create", href: "/docs/wallet#create" },
          { title: "lifi wallet import", href: "/docs/wallet#import" },
          { title: "lifi wallet list", href: "/docs/wallet#list" },
        ],
      },
      {
        title: "Config",
        href: "/docs/config",
        children: [
          { title: "lifi config set", href: "/docs/config#set" },
          { title: "lifi config show", href: "/docs/config#show" },
        ],
      },
      {
        title: "Agent",
        href: "/docs/agent",
        children: [
          { title: "Usage", href: "/docs/agent#usage" },
          { title: "Tools", href: "/docs/agent#tools" },
        ],
      },
      {
        title: "Status",
        href: "/docs/status",
      },
    ],
  },
  {
    label: "Reference",
    items: [{ title: "MCP Tools", href: "/docs/mcp" }],
  },
];

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col flex-1">
      <nav className="w-full border-b border-border-dim bg-bg-secondary/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold text-neon-cyan glow-cyan tracking-tight font-mono">
              lifi-cli
            </Link>
            <span className="text-text-muted text-sm">/</span>
            <span className="text-text-secondary text-sm">Docs</span>
          </div>
          <a
            href="https://www.npmjs.com/package/lifi-cli"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono px-3 py-1.5 rounded-full border border-border-dim text-text-secondary hover:border-neon-cyan hover:text-neon-cyan transition-all"
          >
            lifi-cli
          </a>
        </div>
      </nav>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        <aside className="w-56 shrink-0 border-r border-border-dim py-6 px-4 hidden md:block sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
          {sections.map((section) => (
            <div key={section.label} className="mb-6">
              <div className="text-[11px] font-mono uppercase tracking-widest text-text-muted mb-2 px-3">
                {section.label}
              </div>
              {section.items.map((item) => (
                <div key={item.href}>
                  <Link href={item.href} className="sidebar-link">
                    {item.title}
                  </Link>
                  {"children" in item && item.children && (
                    <div className="ml-4 mt-0.5 mb-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.href + child.title}
                          href={child.href}
                          className="sidebar-link text-xs !py-1 !text-text-muted hover:!text-neon-cyan"
                        >
                          {child.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </aside>

        <main className="flex-1 min-w-0 px-8 py-10 max-w-4xl">{children}</main>
      </div>
    </div>
  );
}
