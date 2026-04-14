"use client";

import { useEffect, useRef, useState } from "react";

const steps = [
  {
    number: "I",
    title: "Install & configure",
    description:
      "Install lifi-cli globally, set your API keys, and create a wallet. Keys are stored in your OS keychain — never on disk in plaintext.",
    code: `# Install
npm install -g lifi-cli

# Set API keys
lifi config set --api-key <LIFI_KEY>
lifi config set --openrouter-key <OPENROUTER_KEY>

# Create a wallet
lifi wallet create --name main

# Set defaults
lifi config set --chain base --wallet main`,
  },
  {
    number: "II",
    title: "Bridge, swap & earn",
    description:
      "Quote routes before committing. Add --execute to submit. Approvals are handled automatically.",
    code: `# Bridge 100 USDC from Base to Arbitrum
lifi bridge \\
  --from USDC --to USDC \\
  --from-chain base --to-chain arbitrum \\
  --amount 100 --wallet main --execute

# Swap ETH to USDC on Base
lifi swap --from ETH --to USDC \\
  --amount 0.01 --wallet main

# Deposit into Morpho yield vault
lifi earn quote \\
  --protocol morpho-usdc --token USDC \\
  --amount 100000000 --wallet main --execute`,
  },
  {
    number: "III",
    title: "Connect AI agents via MCP",
    description:
      "Run as an MCP server and wire into Claude Desktop, Cursor, or any MCP-compatible framework. All DeFi tools exposed natively.",
    code: `// claude_desktop_config.json
{
  "mcpServers": {
    "lifi": {
      "command": "lifi-cli",
      "args": ["mcp"]
    }
  }
}

// Available tools:
// bridge_tokens, swap_tokens, earn_quote
// earn_protocols, list_markets, get_market
// get_tx_status`,
  },
];

export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="relative py-24 lg:py-32 bg-bg-secondary text-foreground overflow-hidden"
    >
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 40px, currentColor 40px, currentColor 41px)`,
          }}
        />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="mb-16 lg:mb-24">
          <span className="inline-flex items-center gap-3 text-sm font-mono text-foreground/40 mb-6">
            <span className="w-8 h-px bg-foreground/20" />
            How it works
          </span>
          <h2
            className={`text-4xl lg:text-6xl font-bold tracking-tight transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Three steps.
            <br />
            <span className="text-foreground/40">Full DeFi coverage.</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          <div className="space-y-0">
            {steps.map((step, index) => (
              <button
                key={step.number}
                type="button"
                onClick={() => setActiveStep(index)}
                className={`w-full text-left py-8 border-b border-foreground/10 transition-all duration-500 group ${
                  activeStep === index ? "opacity-100" : "opacity-40 hover:opacity-70"
                }`}
              >
                <div className="flex items-start gap-6">
                  <span className="font-mono text-3xl text-foreground/20">
                    {step.number}
                  </span>
                  <div className="flex-1">
                    <h3 className="text-2xl lg:text-3xl font-bold mb-3 group-hover:translate-x-2 transition-transform duration-300">
                      {step.title}
                    </h3>
                    <p className="text-foreground/50 leading-relaxed">
                      {step.description}
                    </p>
                    {activeStep === index && (
                      <div className="mt-4 h-px bg-foreground/10 overflow-hidden">
                        <div
                          className="h-full bg-neon-cyan w-0"
                          style={{ animation: "how-progress 5s linear forwards" }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="lg:sticky lg:top-32 self-start">
            <div className="border border-border-dim overflow-hidden rounded-lg">
              <div className="px-6 py-4 border-b border-border-dim flex items-center justify-between">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-foreground/10" />
                  <div className="w-3 h-3 rounded-full bg-foreground/10" />
                  <div className="w-3 h-3 rounded-full bg-foreground/10" />
                </div>
                <span className="text-xs font-mono text-text-muted">
                  lifi-cli
                </span>
              </div>

              <div className="p-8 font-mono text-sm min-h-[280px] bg-bg-primary">
                <pre className="text-text-secondary">
                  {steps[activeStep].code.split("\n").map((line, lineIndex) => (
                    <div
                      key={`${activeStep}-${lineIndex}`}
                      className="leading-loose how-code-line"
                      style={{ animationDelay: `${lineIndex * 80}ms` }}
                    >
                      <span className="text-text-muted select-none w-8 inline-block">
                        {lineIndex + 1}
                      </span>
                      <span className="inline-flex">
                        {line.split("").map((char, charIndex) => (
                          <span
                            key={`${activeStep}-${lineIndex}-${charIndex}`}
                            className="how-code-char"
                            style={{
                              animationDelay: `${lineIndex * 80 + charIndex * 15}ms`,
                            }}
                          >
                            {char === " " ? "\u00A0" : char}
                          </span>
                        ))}
                      </span>
                    </div>
                  ))}
                </pre>
              </div>

              <div className="px-6 py-4 border-t border-border-dim flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                <span className="text-xs font-mono text-text-muted">Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
