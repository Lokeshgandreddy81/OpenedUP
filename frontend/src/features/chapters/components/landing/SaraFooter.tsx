import React from "react";
import { Link } from "react-router-dom";
import { ChatGPTLogo } from "./LandingNavbar";

interface FooterLinkItem {
  label: string;
  href: string;
  external?: boolean;
}

const footerGroups: Array<{
  title: string;
  items: FooterLinkItem[];
}> = [
  {
    title: "Product",
    items: [
      { label: "Features", href: "/features" },
      { label: "Agents", href: "/coding-agents" },
      { label: "Workflows", href: "/#workflows" },
      { label: "Plugins & Skills", href: "/docs" },
    ],
  },
  {
    title: "Capabilities",
    items: [
      { label: "Multi-Agent Orchestration", href: "/features" },
      { label: "Contextual Code Review", href: "/features" },
      { label: "Automated Bug Fixes", href: "/features" },
      { label: "Live Browser Verification", href: "/features" },
    ],
  },
  {
    title: "Developers",
    items: [
      { label: "Documentation", href: "/docs" },
      { label: "API Reference", href: "/docs#reference" },
      { label: "Changelog", href: "/roadmap" },
      { label: "GitHub", href: "https://github.com/Lokeshgandreddy81/OpenedUP", external: true },
      { label: "Benchmarks", href: "/benchmarks" },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "About", href: "/#about" },
      { label: "Careers", href: "mailto:careers@tosara.in", external: true },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Security", href: "/docs#security" },
    ],
  },
];

export const SaraFooter: React.FC = () => (
  <footer className="border-t border-neutral-200/80 bg-[#fafafa] text-neutral-600">
    <div className="mx-auto max-w-[1440px] px-6 py-16 sm:px-10 sm:py-20 lg:px-12">
      <div className="grid grid-cols-2 gap-10 md:grid-cols-5 lg:gap-14">
        <div className="col-span-2 space-y-4 md:col-span-1">
          <Link to="/" className="flex items-center gap-2.5 text-neutral-950 no-underline">
            <ChatGPTLogo className="h-5 w-5 text-neutral-950" />
            <span className="text-[17px] font-semibold tracking-tight">Sara</span>
          </Link>
          <p className="max-w-[240px] text-[13px] leading-relaxed text-neutral-500">
            The AI coding agent built to drive real engineering work across your entire stack.
          </p>
        </div>

        {footerGroups.map((group) => (
          <div key={group.title} className="space-y-3">
            <div className="text-[12.5px] font-semibold uppercase tracking-wider text-neutral-950">
              {group.title}
            </div>
            <ul className="m-0 list-none space-y-2.5 p-0 text-[13.5px]">
              {group.items.map((item) => (
                <li key={item.label}>
                  {item.external ? (
                    <a
                      href={item.href}
                      target={item.href.startsWith("http") ? "_blank" : undefined}
                      rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="text-neutral-600 transition-colors hover:text-neutral-950"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      to={item.href}
                      className="text-neutral-600 transition-colors hover:text-neutral-950"
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-neutral-200/70 pt-8 text-[12.5px] text-neutral-500 sm:mt-16 sm:flex-row">
        <div>© 2026 Sara AI, Inc. All rights reserved.</div>
        <div className="flex items-center gap-6">
          <Link to="/privacy" className="transition-colors hover:text-neutral-950">
            Privacy
          </Link>
          <Link to="/terms" className="transition-colors hover:text-neutral-950">
            Terms
          </Link>
        </div>
      </div>
    </div>
  </footer>
);
