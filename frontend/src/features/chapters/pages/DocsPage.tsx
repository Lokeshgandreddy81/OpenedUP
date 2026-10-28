import React, { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { LandingNavbar } from "../components/landing/LandingNavbar";
import { DocsHero } from "../components/docs/DocsHero";
import { DocsGettingStarted } from "../components/docs/DocsGettingStarted";
import { DocsConcepts } from "../components/docs/DocsConcepts";
import { DocsByok } from "../components/docs/DocsByok";
import { DocsFaq } from "../components/docs/DocsFaq";
import { DocsReference } from "../components/docs/DocsReference";
import { DocsCta } from "../components/docs/DocsCta";

const sectionLinks = [
  { label: "Quickstart", id: "quickstart" },
  { label: "What Sara does", id: "concepts" },
  { label: "Keys & privacy", id: "security" },
  { label: "API reference", id: "reference" },
  { label: "FAQ", id: "faq" },
];

interface SectionNavigationProps {
  onSelect: (id: string) => void;
  layout: "horizontal" | "vertical";
}

const SectionNavigation: React.FC<SectionNavigationProps> = ({ onSelect, layout }) => (
  <nav
    aria-label="Documentation sections"
    className={
      layout === "horizontal"
        ? "mb-2 flex flex-wrap gap-x-6 gap-y-2 border-b border-neutral-200/80 pb-5 text-[13px] font-medium text-neutral-500 lg:hidden"
        : "hidden space-y-2 text-[13px] font-medium text-neutral-500 lg:block"
    }
  >
    {sectionLinks.map((link) => (
      <button
        key={link.id}
        type="button"
        onClick={() => onSelect(link.id)}
        className={`cursor-pointer p-0 text-left transition-colors hover:text-neutral-950 ${
          layout === "horizontal" ? "" : "block"
        }`}
      >
        {link.label}
      </button>
    ))}
  </nav>
);

export const DocsPage: React.FC = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToSection = useCallback((id: string) => {
    const container = containerRef.current;
    const target = document.getElementById(id);

    if (container && target) {
      const top = target.getBoundingClientRect().top + container.scrollTop - 88;
      container.scrollTo({ top, behavior: "smooth" });
    }

    window.history.pushState(null, "", `#${id}`);
  }, []);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash || !document.getElementById(hash)) return;

    const timeoutId = window.setTimeout(() => scrollToSection(hash), 120);
    return () => window.clearTimeout(timeoutId);
  }, [scrollToSection]);

  const handleStart = () => navigate("/chat");

  return (
    <div
      ref={containerRef}
      className="openedup-home h-dvh w-full overflow-y-auto overflow-x-hidden bg-white font-sans text-neutral-900 selection:bg-neutral-900 selection:text-white"
    >
      <LandingNavbar onGetStarted={handleStart} />

      <div className="mx-auto flex w-full max-w-[1120px] items-start gap-10 px-6 pt-28 pb-12 sm:px-8 lg:px-10">
        <aside className="hidden w-[150px] shrink-0 pt-1 lg:sticky lg:top-28 lg:block">
          <SectionNavigation layout="vertical" onSelect={scrollToSection} />
        </aside>

        <main className="min-w-0 w-full max-w-[860px] flex-1">
          <DocsHero />
          <SectionNavigation layout="horizontal" onSelect={scrollToSection} />
          <DocsGettingStarted />
          <DocsConcepts />
          <DocsByok />
          <DocsReference />
          <DocsFaq />
          <DocsCta />
        </main>
      </div>
    </div>
  );
};

export default DocsPage;
