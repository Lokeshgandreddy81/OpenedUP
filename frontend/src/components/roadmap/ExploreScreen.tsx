import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { RoadmapPage } from "./RoadmapPage";
import { getRoadmapPageById } from "../../pages/roadmaps";

interface ExploreScreenProps {
  onBack: () => void;
}

interface CatalogRoadmap {
  id: string;
  title: string;
  isNew?: boolean;
}

const ROLE_ROADMAPS: CatalogRoadmap[] = [
  { id: "frontend", title: "Frontend" },
  { id: "backend", title: "Backend" },
  { id: "full-stack", title: "Full Stack" },
  { id: "android", title: "Android" },
  { id: "devops", title: "DevOps" },
  { id: "devsecops", title: "DevSecOps" },
  { id: "data-analyst", title: "Data Analyst" },
  { id: "seo", title: "SEO", isNew: true },
  { id: "inference-engineering", title: "Inference Engineering", isNew: true },
  { id: "ai-engineer", title: "AI Engineer" },
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
  { id: "forward-deployed-engineer", title: "FDE Roadmap" },
];

const SKILL_ROADMAPS: CatalogRoadmap[] = [
  { id: "skill-ai-agents", title: "AI Agents" },
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
  { id: "skill-dsa", title: "Data Structures & Algorithms" },
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
  { id: "skill-kubernetes", title: "Kubernetes" },
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
  { id: "skill-python", title: "Python" },
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
  { id: "skill-system-design", title: "System Design" },
  { id: "skill-terraform", title: "Terraform" },
  { id: "skill-typescript", title: "TypeScript" },
  { id: "skill-vibe-coding", title: "Vibe Coding" },
  { id: "skill-vue", title: "Vue" },
  { id: "skill-wordpress", title: "WordPress" },
];

const BEST_PRACTICE_ROADMAPS: CatalogRoadmap[] = [
  { id: "best-practice-aws", title: "AWS" },
  { id: "best-practice-api-security", title: "API Security" },
  { id: "best-practice-backend-performance", title: "Backend Performance" },
  { id: "best-practice-frontend-performance", title: "Frontend Performance" },
  { id: "best-practice-code-review", title: "Code Review" },
];

const ALL_ROADMAPS = [...ROLE_ROADMAPS, ...SKILL_ROADMAPS, ...BEST_PRACTICE_ROADMAPS];

const ROADMAP_GRID_CLASS =
  "mt-6 grid grid-cols-1 gap-x-8 gap-y-1.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

export const ExploreScreen: React.FC<ExploreScreenProps> = ({ onBack }) => {
  const [query, setQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedRoadmap, setSelectedRoadmap] = useState<CatalogRoadmap | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
      } else {
        onBack();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedRoadmap, onBack]);

  const renderRoadmapCard = (roadmap: CatalogRoadmap) => {
    return (
      <button
        key={roadmap.id}
        type="button"
        onClick={() => setSelectedRoadmap(roadmap)}
        className="group flex min-h-[38px] items-center justify-start rounded-md px-2.5 -mx-2.5 text-left text-[13.5px] font-medium leading-snug text-slate-700 hover:text-slate-950 hover:bg-slate-100/70 active:bg-slate-200/60 transition-colors duration-150 cursor-pointer"
      >
        <span className="truncate group-hover:translate-x-0.5 transition-transform duration-150">
          {roadmap.title}
        </span>
      </button>
    );
  };

  if (selectedRoadmap) {
    const CustomRoadmapPage = getRoadmapPageById(selectedRoadmap.id);

    if (CustomRoadmapPage) {
      return (
        <CustomRoadmapPage
          onBack={() => setSelectedRoadmap(null)}
          onSelectRoadmap={handleSelectRoadmap}
        />
      );
    }

    return <RoadmapPage roadmap={selectedRoadmap} onBack={() => setSelectedRoadmap(null)} />;
  }

  return (
    <div className="explore-screen fixed inset-0 z-[60] overflow-y-auto overscroll-contain bg-[#FFFFFF] font-sans text-[#0F172A] animate-in fade-in duration-150">
      <button
        type="button"
        onClick={onBack}
        className="fixed left-5 top-5 z-20 inline-flex h-8 items-center gap-1.5 px-3 rounded-md text-[12px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      <div className="mx-auto w-full max-w-[1360px] px-6 sm:px-10 pb-28 pt-14 sm:pt-20">
        <div className="relative flex items-center justify-center">
          <h1 className="font-serif text-4xl sm:text-5xl font-normal text-slate-900 tracking-tight leading-tight">
            Roadmaps
          </h1>

          {/* Persistent, unobtrusive search control aligned on the right of the header */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {isSearchOpen && (
              <input
                ref={searchInputRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search roadmaps..."
                aria-label="Search roadmaps"
                className="h-8 w-48 sm:w-64 border-b border-slate-300 bg-transparent px-2 text-[13px] font-normal text-slate-900 outline-none focus:border-slate-900 placeholder:text-slate-400 transition-colors [&::-webkit-search-cancel-button]:hidden"
              />
            )}
            <button
              type="button"
              onClick={() => {
                if (isSearchOpen) {
                  if (query) setQuery("");
                  setIsSearchOpen(false);
                } else {
                  setIsSearchOpen(true);
                  requestAnimationFrame(() => searchInputRef.current?.focus());
                }
              }}
              aria-label="Search roadmaps"
              className="grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Search size={16} strokeWidth={2} />
            </button>
          </div>
        </div>

        <main className="mt-12 space-y-16">
          {(!isSearching || filteredRoles.length > 0) && (
            <section aria-label="Role-based roadmaps">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-baseline gap-2">
                  <h2 className="text-xl sm:text-[22px] font-semibold tracking-tight text-slate-900">
                    Roles
                  </h2>
                  {isSearching && (
                    <span className="text-[12px] font-medium text-slate-400">
                      ({filteredRoles.length})
                    </span>
                  )}
                </div>
              </div>

              <div className={ROADMAP_GRID_CLASS}>{filteredRoles.map(renderRoadmapCard)}</div>
            </section>
          )}

          {(!isSearching || filteredSkills.length > 0) && (
            <section aria-label="Skills roadmaps">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-baseline gap-2">
                  <h2 className="text-xl sm:text-[22px] font-semibold tracking-tight text-slate-900">
                    Skills
                  </h2>
                  {isSearching && (
                    <span className="text-[12px] font-medium text-slate-400">
                      ({filteredSkills.length})
                    </span>
                  )}
                </div>
              </div>
              <div className={ROADMAP_GRID_CLASS}>{filteredSkills.map(renderRoadmapCard)}</div>
            </section>
          )}

          {(!isSearching || filteredBestPractices.length > 0) && (
            <section aria-label="Best practices roadmaps">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-baseline gap-2">
                  <h2 className="text-xl sm:text-[22px] font-semibold tracking-tight text-slate-900">
                    Best Practices
                  </h2>
                  {isSearching && (
                    <span className="text-[12px] font-medium text-slate-400">
                      ({filteredBestPractices.length})
                    </span>
                  )}
                </div>
              </div>
              <div className={ROADMAP_GRID_CLASS}>
                {filteredBestPractices.map(renderRoadmapCard)}
              </div>
            </section>
          )}

          {isSearching && !hasResults && (
            <div className="flex min-h-[220px] flex-col items-center justify-center px-6 text-center">
              <p className="text-[14px] font-medium text-slate-600">
                No roadmaps match “{query.trim()}”
              </p>
              <button
                type="button"
                onClick={() => setQuery("")}
                className="mt-3 text-[13px] font-medium text-slate-900 underline underline-offset-4 hover:text-black cursor-pointer"
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
