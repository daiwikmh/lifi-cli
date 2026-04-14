import Link from "next/link";
import "./landing.css";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { HowItWorksSection } from "@/components/how-it-works";
import { DevelopersSection } from "@/components/developers-section";

export default function Home() {
  return (
    <>
      <Header />

      <div className="flex flex-col min-h-svh justify-center items-center pt-28 pb-16 gap-10">
        <div className="text-center relative">
          <div className="font-mono text-neon-green glow-green text-xs mb-4 tracking-widest uppercase">
            Terminal-native DeFi
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white">
            <span className="gradient-text">lifi-cli</span>
          </h1>
          <p className="font-mono text-sm sm:text-base text-text-secondary text-balance mt-6 max-w-[540px] mx-auto leading-relaxed">
            Bridge, swap, earn yield, and browse prediction markets.
            <br />
            Infrastructure for humans and AI agents.
          </p>

          <div className="flex items-center justify-center gap-4 mt-14">
            <Link className="contents" href="/docs">
              <Button>[Get Started]</Button>
            </Link>
          </div>

          <div className="mt-8 font-mono text-sm text-text-muted">
            <span className="text-neon-green">$</span>{" "}
            npm install -g lifi-cli
          </div>
        </div>
      </div>

      <HowItWorksSection />
      <DevelopersSection />

      <footer className="w-full border-t border-border-dim py-8 mt-auto">
        <div className="container max-w-6xl mx-auto flex items-center justify-between text-xs text-text-muted font-mono">
          <span>lifi-cli — MIT License</span>
          <div className="flex gap-4">
            <a
              href="https://www.npmjs.com/package/lifi-cli"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-neon-cyan transition-colors"
            >
              npm
            </a>
            <a
              href="https://li.fi"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-neon-cyan transition-colors"
            >
              LI.FI
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
