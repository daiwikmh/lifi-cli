import Link from "next/link";

export const Header = () => {
  return (
    <div className="fixed z-50 pt-8 md:pt-14 top-0 left-0 w-full">
      <header className="flex items-center justify-between container">
        <Link href="/" className="text-2xl font-bold text-neon-cyan glow-cyan tracking-tight font-mono">
          lifi-cli
        </Link>
        <nav className="flex items-center justify-center gap-x-10">
          {["Docs", "Bridge", "Earn", "Markets"].map((item) => (
            <Link
              className="uppercase hidden lg:inline-block font-mono text-foreground/60 hover:text-foreground/100 duration-150 transition-colors ease-out text-sm"
              href={item === "Docs" ? "/docs" : `/docs/${item.toLowerCase()}`}
              key={item}
            >
              {item}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-6">
          <Link
            className="uppercase transition-colors ease-out duration-150 font-mono text-primary hover:text-primary/80 text-sm"
            href="/docs/mcp"
          >
            MCP Tools
          </Link>
          <Link
            className="uppercase transition-colors ease-out duration-150 font-mono text-neon-cyan/70 hover:text-neon-cyan text-sm"
            href="/playground/earn"
          >
            Playground
          </Link>
        </div>
      </header>
    </div>
  );
};
