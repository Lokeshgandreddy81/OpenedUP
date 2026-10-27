import React, { Suspense, useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, Search, Star } from "lucide-react";
import { RoadmapPage } from "./RoadmapPage";
import { getRoadmapPageById } from "../pages/catalog/index";
import { RoadmapPageSkeleton } from "../pages/RoadmapPage/LoadingSkeleton";

interface RoadmapExplorerProps {
  onBack: () => void;
  isEmbedded?: boolean;
}

interface CatalogRoadmap {
  id: string;
  title: string;
  isNew?: boolean;
  isStarred?: boolean;
}

const ROLE_ROADMAPS: CatalogRoadmap[] = [
  { id: "frontend", title: "Frontend" },
  { id: "backend", title: "Backend", isStarred: true },
  { id: "full-stack", title: "Full Stack", isStarred: true },
  { id: "android", title: "Android" },
  { id: "devops", title: "DevOps", isStarred: true },
  { id: "devsecops", title: "DevSecOps" },
  { id: "data-analyst", title: "Data Analyst" },
  { id: "seo", title: "SEO", isNew: true },
  { id: "inference-engineering", title: "Inference Engineering", isNew: true },
  { id: "ai-engineer", title: "AI Engineer", isStarred: true },
  { id: "ai-and-data-scientist", title: "AI and Data Scientist" },
  { id: "data-engineer", title: "Data Engineer" },
  { id: "machine-learning", title: "Machine Learning" },
  { id: "product-design", title: "Product Design" },
  { id: "postgresql", title: "PostgreSQL" },
  { id: "ios", title: "iOS" },
  { id: "blockchain", title: "Blockchain" },
  { id: "qa", title: "QA" },
  { id: "software-architect", title: "Software Architect" },
  { id: "cyber-security", title: "Cyber Security" },
  { id: "ux-design", title: "UX Design" },
  { id: "technical-writer", title: "Technical Writer" },
  { id: "game-developer", title: "Game Developer" },
  {
    id: "server-side-game-developer",
    title: "Server-Side Game Dev",
  },
  { id: "mlops", title: "MLOps" },
  { id: "product-manager", title: "Product Manager" },
  { id: "engineering-manager", title: "Engineering Manager" },
  { id: "developer-relations", title: "Developer Relations" },
  { id: "bi-analyst", title: "BI Analyst" },
  { id: "network-engineer", title: "Network Engineer" },
  { id: "forward-deployed-engineer", title: "FDE" },
];

const SKILL_ROADMAPS: CatalogRoadmap[] = [
  { id: "skill-ai-agents", title: "AI Agents", isStarred: true },
  { id: "skill-ai-product-builders", title: "AI Product Builders" },
  { id: "skill-ai-red-teaming", title: "AI Red Teaming" },
  { id: "skill-angular", title: "Angular" },
  { id: "skill-api-design", title: "API Design" },
  { id: "skill-aspnet-core", title: "ASP.NET Core" },
  { id: "skill-aws", title: "AWS" },
  { id: "skill-c-programming", title: "C Programming" },
  { id: "skill-cpp", title: "C++" },
  { id: "skill-claude-code", title: "Claude Code" },
  { id: "skill-cloudflare", title: "Cloudflare" },
  { id: "skill-code-review", title: "Code Review" },
  { id: "skill-computer-science", title: "Computer Science" },
  { id: "skill-css", title: "CSS" },
  { id: "skill-dsa", title: "Data Structures & Algorithms", isStarred: true },
  { id: "skill-design-architecture", title: "Design and Architecture" },
  { id: "skill-design-system", title: "Design System" },
  { id: "skill-django", title: "Django" },
  { id: "skill-docker", title: "Docker" },
  { id: "skill-elasticsearch", title: "Elasticsearch" },
  { id: "skill-flutter", title: "Flutter" },
  { id: "skill-git-github", title: "Git and GitHub" },
  { id: "skill-go", title: "Go Roadmap" },
  { id: "skill-graphql", title: "GraphQL" },
  { id: "skill-html", title: "HTML" },
  { id: "skill-java", title: "Java" },
  { id: "skill-javascript", title: "JavaScript" },
  { id: "skill-kotlin", title: "Kotlin" },
  { id: "skill-kubernetes", title: "Kubernetes", isStarred: true },
  { id: "skill-laravel", title: "Laravel" },
  { id: "skill-leetcode", title: "LeetCode" },
  { id: "skill-linux", title: "Linux" },
  { id: "skill-mongodb", title: "MongoDB" },
  { id: "skill-nextjs", title: "Next.js" },
  { id: "skill-nodejs", title: "Node.js" },
  { id: "skill-openclaw", title: "OpenClaw" },
  { id: "skill-php", title: "PHP" },
  { id: "skill-power-bi", title: "Power BI" },
  { id: "skill-prompt-engineering", title: "Prompt Engineering" },
  { id: "skill-python", title: "Python", isStarred: true },
  { id: "skill-python-data-analysis", title: "Python for Data Analysis" },
  { id: "skill-r-programming", title: "R Programming" },
  { id: "skill-react", title: "React" },
  { id: "skill-react-native", title: "React Native" },
  { id: "skill-redis", title: "Redis" },
  { id: "skill-ruby", title: "Ruby" },
  { id: "skill-ruby-on-rails", title: "Ruby on Rails" },
  { id: "skill-rust", title: "Rust" },
  { id: "skill-scala", title: "Scala" },
  { id: "skill-shell", title: "Shell / Bash" },
  { id: "skill-spring-boot", title: "Spring Boot" },
  { id: "skill-sql", title: "SQL" },
  { id: "skill-swift", title: "Swift & Swift UI" },
  { id: "skill-system-design", title: "System Design", isStarred: true },
  { id: "skill-terraform", title: "Terraform" },
  { id: "skill-typescript", title: "TypeScript" },
  { id: "skill-vibe-coding", title: "Vibe Coding" },
  { id: "skill-vue", title: "Vue" },
  { id: "skill-wordpress", title: "WordPress" },
];

const BEST_PRACTICE_ROADMAPS: CatalogRoadmap[] = [
  { id: "best-practice-aws", title: "AWS" },
  { id: "best-practice-api-security", title: "API Security" },
  { id: "best-practice-backend-performance", title: "Backend Performance", isStarred: true },
  { id: "best-practice-frontend-performance", title: "Frontend Performance" },
  { id: "best-practice-code-review", title: "Code Review" },
];

const ALL_ROADMAPS = [...ROLE_ROADMAPS, ...SKILL_ROADMAPS, ...BEST_PRACTICE_ROADMAPS];

const ROADMAP_GRID_CLASS =
  "mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5";

export const RoadmapExplorer: React.FC<RoadmapExplorerProps> = ({ onBack, isEmbedded = false }) => {
  const [query, setQuery] = useState("");
  const [selectedRoadmap, setSelectedRoadmap] = useState<CatalogRoadmap | null>(null);
  const totalRoadmaps = ALL_ROADMAPS.length;

  const needle = query.trim().toLowerCase();
  const filterRoadmaps = (roadmaps: CatalogRoadmap[]) => {
    if (!needle) return roadmaps;
    return roadmaps.filter((roadmap) => roadmap.title.toLowerCase().includes(needle));
  };

  const handleSelectRoadmap = (roadmapId: string) => {
    const roadmap = ALL_ROADMAPS.find((entry) => entry.id === roadmapId);
    if (roadmap) {
      setSelectedRoadmap(roadmap);
    }
  };

  const filteredRoles = filterRoadmaps(ROLE_ROADMAPS);
  const filteredSkills = filterRoadmaps(SKILL_ROADMAPS);
  const filteredBestPractices = filterRoadmaps(BEST_PRACTICE_ROADMAPS);
  const isSearching = needle.length > 0;
  const hasResults =
    filteredRoles.length + filteredSkills.length + filteredBestPractices.length > 0;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (selectedRoadmap) {
        setSelectedRoadmap(null);
      } else if (!isEmbedded) {
        onBack();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedRoadmap, isEmbedded, onBack]);

  const renderRoadmapCard = (roadmap: CatalogRoadmap) => {
    return (
      <button
        key={roadmap.id}
        type="button"
        onClick={() => setSelectedRoadmap(roadmap)}
        className="group flex min-h-11 min-w-0 items-center justify-between rounded-lg px-3 text-left text-[14px] font-medium leading-snug text-neutral-700 transition-colors duration-150 hover:bg-neutral-100/70 hover:text-neutral-950 active:bg-neutral-200/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500/70"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="truncate group-hover:translate-x-0.5 transition-transform duration-150">
            {roadmap.title}
          </span>
          {roadmap.isStarred && (
            <span title="Popular roadmap" className="inline-flex shrink-0">
              <Star
                size={12}
                className="fill-neutral-500 text-neutral-500 transition-transform duration-150 group-hover:scale-110"
              />
            </span>
          )}
          {roadmap.isNew && (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
              New
            </span>
          )}
        </div>
        <ArrowUpRight
          size={14}
          aria-hidden="true"
          className="ml-2 shrink-0 text-neutral-500 opacity-0 transition-all duration-150 group-hover:translate-x-0.5 group-hover:opacity-100"
        />
      </button>
    );
  };

  if (selectedRoadmap) {
    const CustomRoadmapPage = getRoadmapPageById(selectedRoadmap.id);

    if (CustomRoadmapPage) {
      return (
        <div
          data-roadmap-detail-open="true"
          className={
            isEmbedded
              ? "flex-1 w-full h-full min-w-0 relative overflow-y-auto overscroll-contain bg-[#FFFFFF] font-sans text-[#0F172A]"
              : "fixed inset-0 z-[60] overflow-y-auto overscroll-contain bg-[#FFFFFF] font-sans text-[#0F172A] animate-in fade-in duration-150"
          }
        >
          <Suspense fallback={<RoadmapPageSkeleton />}>
            <CustomRoadmapPage
              onBack={() => setSelectedRoadmap(null)}
              onSelectRoadmap={handleSelectRoadmap}
            />
          </Suspense>
        </div>
      );
    }

    return (
      <div
        data-roadmap-detail-open="true"
        className={
          isEmbedded
            ? "flex-1 w-full h-full min-w-0 relative overflow-y-auto overscroll-contain bg-[#FFFFFF] font-sans text-[#0F172A]"
            : "fixed inset-0 z-[60] overflow-y-auto overscroll-contain bg-[#FFFFFF] font-sans text-[#0F172A] animate-in fade-in duration-150"
        }
      >
        <RoadmapPage roadmap={selectedRoadmap} onBack={() => setSelectedRoadmap(null)} />
      </div>
    );
  }

  return (
    <div
      className={
        isEmbedded
          ? "explore-screen flex-1 w-full h-full min-w-0 relative overflow-y-auto overscroll-contain bg-white font-sans text-neutral-950"
          : "explore-screen fixed inset-0 z-[60] overflow-y-auto overscroll-contain bg-white font-sans text-neutral-950 animate-in fade-in duration-150"
      }
    >
      {!isEmbedded && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="fixed left-5 top-5 z-20 inline-flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:text-neutral-950 cursor-pointer"
        >
          <ArrowLeft size={16} strokeWidth={1.75} />
        </button>
      )}

      <div
        className={`mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12 pb-24 ${isEmbedded ? "pt-9 sm:pt-12" : "pt-16 sm:pt-20"}`}
      >
        <header className="flex flex-col gap-7 pb-2 sm:flex-row sm:items-end sm:justify-between sm:gap-10">
          <div className="max-w-2xl">
            <h1 className="font-serif text-[46px] font-medium leading-[1.02] tracking-tight text-neutral-950 sm:text-[60px]">
              Roadmaps
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-7 text-neutral-600 sm:text-[16px]">
              Explore {totalRoadmaps} paths for your next role, skill, or engineering challenge.
            </p>
          </div>
          <label className="group flex h-11 w-full max-w-[320px] shrink-0 items-center gap-3 text-neutral-500 transition-colors duration-200 focus-within:text-neutral-950 sm:mb-1">
            <Search
              size={17}
              strokeWidth={1.8}
              aria-hidden="true"
              className="shrink-0 transition-transform duration-200 group-focus-within:scale-105"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search all roadmaps"
              aria-label="Search roadmaps"
              className="min-w-0 flex-1 bg-transparent text-[13px] text-neutral-950 outline-none transition-colors duration-200 placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-0 [&::-webkit-search-cancel-button]:hidden"
            />
          </label>
        </header>

        <main className="mt-12 space-y-14 sm:mt-16 sm:space-y-16">
          {(!isSearching || filteredRoles.length > 0) && (
            <section aria-label="Role-based roadmaps" className="py-1">
              <h2 className="font-serif text-[30px] font-medium tracking-tight text-neutral-950 sm:text-[34px]">
                Roles
              </h2>

              <div className={ROADMAP_GRID_CLASS}>{filteredRoles.map(renderRoadmapCard)}</div>
            </section>
          )}

          {(!isSearching || filteredSkills.length > 0) && (
            <section aria-label="Skills roadmaps" className="py-1">
              <h2 className="font-serif text-[30px] font-medium tracking-tight text-neutral-950 sm:text-[34px]">
                Skills
              </h2>
              <div className={ROADMAP_GRID_CLASS}>{filteredSkills.map(renderRoadmapCard)}</div>
            </section>
          )}

          {(!isSearching || filteredBestPractices.length > 0) && (
            <section aria-label="Best practices roadmaps" className="py-1">
              <h2 className="font-serif text-[30px] font-medium tracking-tight text-neutral-950 sm:text-[34px]">
                Best practices
              </h2>
              <div className={ROADMAP_GRID_CLASS}>
                {filteredBestPractices.map(renderRoadmapCard)}
              </div>
            </section>
          )}

          {isSearching && !hasResults && (
            <div className="flex min-h-[220px] flex-col items-center justify-center px-6 text-center">
              <p className="text-[14px] font-medium text-neutral-600">
                No roadmaps match “{query.trim()}”
              </p>
              <button
                type="button"
                onClick={() => setQuery("")}
                className="mt-3 text-[13px] font-medium text-neutral-800 underline underline-offset-4 hover:text-black cursor-pointer"
              >
                Clear search
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default RoadmapExplorer;
