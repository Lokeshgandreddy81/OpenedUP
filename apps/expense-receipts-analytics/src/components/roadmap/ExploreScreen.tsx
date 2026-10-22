import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { RoadmapPage } from "./RoadmapPage";

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
  { id: "forward-deployed-engineer", title: "Forward Deployed Engineer" },
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

const ROADMAP_GRID_CLASS =
  "mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6";

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
        className="flex h-12 items-center justify-start px-0 text-left text-[13px] font-semibold tracking-tight text-[#0F172A]"
      >
        {roadmap.title}
      </button>
    );
  };

  if (selectedRoadmap) {
    return <RoadmapPage roadmap={selectedRoadmap} onBack={() => setSelectedRoadmap(null)} />;
  }

  return (
    <div className="explore-screen fixed inset-0 z-[60] overflow-y-auto overscroll-contain bg-[#FFFFFF] font-sans text-[#0F172A] animate-in fade-in duration-150">
      <button
        type="button"
        onClick={onBack}
        className="fixed left-4 top-4 z-20 inline-flex h-8 items-center gap-1.5 px-3 text-[12px] font-medium text-[#0F172A] cursor-pointer"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      <div className="mx-auto w-full max-w-[1440px] px-6 pb-24 pt-12 sm:pt-[4rem]">
        <div className="flex items-center justify-center">
          <h1 className="font-serif text-4xl sm:text-5xl font-normal text-[#0F172A] tracking-tight leading-tight">
            Roadmaps
          </h1>
        </div>

        <main className="mt-9 space-y-14">
          <section aria-label="Role-based roadmaps">
            <div className="flex items-center justify-between">
              <h2 className="text-[26px] font-semibold text-[#0F172A]">Roles</h2>
              <div className="flex items-center gap-3">
                {isSearchOpen && (
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search roadmaps"
                    aria-label="Search roadmaps"
                    className="h-9 w-64 rounded-none border border-transparent bg-transparent px-4 text-[14px] font-medium text-[#0F172A] outline-none placeholder:text-[#0F172A]/60 [&::-webkit-search-cancel-button]:hidden"
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
                  className="grid h-9 w-9 place-items-center rounded-none bg-transparent text-[#0F172A] cursor-pointer"
                >
                  <Search size={18} strokeWidth={2} />
                </button>
              </div>
            </div>

            {filteredRoles.length > 0 && (
              <div className={ROADMAP_GRID_CLASS}>{filteredRoles.map(renderRoadmapCard)}</div>
            )}
          </section>

          {filteredSkills.length > 0 && (
            <section aria-label="Skills roadmaps">
              <h2 className="text-[26px] font-semibold text-[#0F172A]">Skills</h2>
              <div className={ROADMAP_GRID_CLASS}>{filteredSkills.map(renderRoadmapCard)}</div>
            </section>
          )}

          {filteredBestPractices.length > 0 && (
            <section aria-label="Best practices roadmaps">
              <h2 className="text-[26px] font-semibold text-[#0F172A]">Best Practices</h2>
              <div className={ROADMAP_GRID_CLASS}>
                {filteredBestPractices.map(renderRoadmapCard)}
              </div>
            </section>
          )}

          {isSearching && !hasResults && (
            <div className="flex min-h-[220px] flex-col items-center justify-center px-6 text-center">
              <p className="text-[14px] font-medium text-[#0F172A]">
                No roadmaps match “{query.trim()}”
              </p>
              <button
                type="button"
                onClick={() => setQuery("")}
                className="mt-3 text-[13px] font-medium text-[#0F172A] cursor-pointer"
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
