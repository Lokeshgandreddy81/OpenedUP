import React from "react";
import { ChatGPTLogo } from "./LandingNavbar";

const footerGroups = [
  {
    title: "Product",
    items: ["Features", "Agents", "Workflows", "Plugins & Skills"],
  },
  {
    title: "Capabilities",
    items: [
      "Multi-Agent Orchestration",
      "Contextual Code Review",
      "Automated Bug Fixes",
      "Live Browser Verification",
    ],
  },
  {
    title: "Developers",
    items: ["Documentation", "API Reference", "Changelog", "GitHub", "Benchmarks"],
  },
  {
    title: "Company",
    items: ["About", "Careers", "Privacy Policy", "Terms of Service", "Security"],
  },
];

export const SaraFooter: React.FC = () => (
  <footer className="border-t border-neutral-200/80 bg-[#fafafa] text-neutral-600">
    <div className="mx-auto max-w-[1440px] px-6 py-16 sm:px-10 sm:py-20 lg:px-12">
      <div className="grid grid-cols-2 gap-10 md:grid-cols-5 lg:gap-14">
        <div className="col-span-2 space-y-4 md:col-span-1">
          <div className="flex items-center gap-2.5 text-neutral-950">
            <ChatGPTLogo className="h-5 w-5 text-neutral-950" />
            <span className="text-[17px] font-semibold tracking-tight">Sara</span>
          </div>
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
                <li key={item} className="text-neutral-600">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-neutral-200/70 pt-8 text-[12.5px] text-neutral-500 sm:mt-16 sm:flex-row">
        <div>© 2026 Sara AI, Inc. All rights reserved.</div>
        <div className="flex items-center gap-6">
          <span>Privacy</span>
          <span>Terms</span>
        </div>
      </div>
    </div>
  </footer>
);
