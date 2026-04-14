"use client";

import { useState, useEffect, useRef } from "react";

const codeExamples = [
  {
    label: "CLI",
    code: `# Install
npm install -g lifi-cli

# Bridge tokens
lifi bridge --from USDC --to USDC \\
  --from-chain base --to-chain arbitrum \\
  --amount 100 --wallet main --execute

# Run AI agent
lifi agent --model anthropic/claude-3.5-sonnet`,
  },
  {
    label: "MCP",
    code: `// claude_desktop_config.json
{
  "mcpServers": {
    "lifi": {
      "command": "lifi-cli",
      "args": ["mcp"]
    }
  }
}`,
  },
  {
    label: "Tools",
    code: `// 7 MCP tools available
bridge_tokens({ fromChain, toChain, fromToken, toToken, amount })
swap_tokens({ chain, fromToken, toToken, amount })
earn_quote({ protocol, token, amount, chain })
earn_protocols({ category? })
list_markets({ query?, limit? })
get_market({ slug })
get_tx_status({ txHash, fromChain?, toChain? })`,
  },
];

const features = [
  { title: "30+ chains", description: "All major EVM chains via LI.FI routing." },
  { title: "7 MCP tools", description: "Bridge, swap, earn, markets, and status." },
  { title: "OS keychain", description: "Private keys stored securely, never plaintext." },
  { title: "JSON output", description: "Every command supports --json for scripting." },
];

export function DevelopersSection() {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeExamples[activeTab].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

  return (
    <section
      id="developers"
      ref={sectionRef}
      className="relative py-24 lg:py-32 overflow-hidden"
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          <div
            className={`transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <span className="inline-flex items-center gap-3 text-sm font-mono text-foreground/40 mb-6">
              <span className="w-8 h-px bg-foreground/30" />
              For developers & agents
            </span>
            <h2 className="text-4xl lg:text-6xl font-bold tracking-tight mb-8">
              Built for agents.
              <br />
              <span className="text-foreground/40">Powered by LI.FI.</span>
            </h2>
            <p className="text-xl text-foreground/50 mb-12 leading-relaxed">
              Drop into any MCP-compatible client in one line. All DeFi
              operations — bridging, swapping, yield, prediction markets — in a
              single gateway.
            </p>

            <div className="grid grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className={`transition-all duration-500 ${
                    isVisible
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-4"
                  }`}
                  style={{ transitionDelay: `${index * 50 + 200}ms` }}
                >
                  <h3 className="font-medium mb-1 text-text-primary">{feature.title}</h3>
                  <p className="text-sm text-text-secondary">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div
            className={`lg:sticky lg:top-32 transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            }`}
          >
            <div className="border border-border-dim rounded-lg overflow-hidden">
              <div className="flex items-center border-b border-border-dim">
                {codeExamples.map((example, idx) => (
                  <button
                    key={example.label}
                    type="button"
                    onClick={() => setActiveTab(idx)}
                    className={`px-6 py-4 text-sm font-mono transition-colors relative ${
                      activeTab === idx
                        ? "text-neon-cyan"
                        : "text-text-muted hover:text-text-secondary"
                    }`}
                  >
                    {example.label}
                    {activeTab === idx && (
                      <span className="absolute bottom-0 left-0 right-0 h-px bg-neon-cyan" />
                    )}
                  </button>
                ))}
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-4 py-4 text-text-muted hover:text-text-primary transition-colors font-mono text-xs"
                >
                  {copied ? "copied!" : "copy"}
                </button>
              </div>

              <div className="p-8 font-mono text-sm bg-bg-secondary min-h-[220px]">
                <pre className="text-text-secondary">
                  {codeExamples[activeTab].code.split("\n").map((line, lineIndex) => (
                    <div
                      key={`${activeTab}-${lineIndex}`}
                      className="leading-loose dev-code-line"
                      style={{ animationDelay: `${lineIndex * 80}ms` }}
                    >
                      <span className="inline-flex">
                        {line.split("").map((char, charIndex) => (
                          <span
                            key={`${activeTab}-${lineIndex}-${charIndex}`}
                            className="dev-code-char"
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
            </div>

            <div className="mt-6 flex items-center gap-6 text-sm font-mono">
              <a href="/docs" className="text-text-primary hover:text-neon-cyan transition-colors">
                Read the docs
              </a>
              <span className="text-text-muted">|</span>
              <a href="/docs/mcp" className="text-text-muted hover:text-text-primary transition-colors">
                MCP Tools Reference
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
