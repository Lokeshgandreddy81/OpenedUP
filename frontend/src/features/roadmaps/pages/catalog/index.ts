import { type ComponentType, type LazyExoticComponent } from "react";
import { lazyWithRetry as lazy } from "../../../../app/components/lazyWithRetry";

export type RoadmapPageProps = {
  onBack?: () => void;
  onSelectRoadmap?: (roadmapId: string) => void;
};

export const ROADMAP_PAGES: Record<string, LazyExoticComponent<ComponentType<RoadmapPageProps>>> = {
  frontend: lazy(() =>
    import("./roles/FrontendPage").then(({ FrontendPage }) => ({ default: FrontendPage }))
  ),
  backend: lazy(() =>
    import("./roles/BackendPage").then(({ BackendPage }) => ({ default: BackendPage }))
  ),
  "full-stack": lazy(() =>
    import("./roles/FullStackRoadmapPage").then(({ FullStackRoadmapPage }) => ({
      default: FullStackRoadmapPage,
    }))
  ),
  android: lazy(() =>
    import("./roles/AndroidPage").then(({ AndroidPage }) => ({ default: AndroidPage }))
  ),
  devops: lazy(() =>
    import("./roles/DevOpsPage").then(({ DevOpsPage }) => ({ default: DevOpsPage }))
  ),
  devsecops: lazy(() =>
    import("./roles/DevSecOpsPage").then(({ DevSecOpsPage }) => ({ default: DevSecOpsPage }))
  ),
  "data-analyst": lazy(() =>
    import("./roles/DataAnalystPage").then(({ DataAnalystPage }) => ({ default: DataAnalystPage }))
  ),
  seo: lazy(() => import("./roles/SeoPage").then(({ SeoPage }) => ({ default: SeoPage }))),
  "inference-engineering": lazy(() =>
    import("./roles/InferenceEngineeringPage").then(({ InferenceEngineeringPage }) => ({
      default: InferenceEngineeringPage,
    }))
  ),
  "ai-engineer": lazy(() =>
    import("./roles/AiEngineerPage").then(({ AiEngineerPage }) => ({ default: AiEngineerPage }))
  ),
  "ai-and-data-scientist": lazy(() =>
    import("./roles/AiAndDataScientistPage").then(({ AiAndDataScientistPage }) => ({
      default: AiAndDataScientistPage,
    }))
  ),
  "data-engineer": lazy(() =>
    import("./roles/DataEngineerPage").then(({ DataEngineerPage }) => ({
      default: DataEngineerPage,
    }))
  ),
  "machine-learning": lazy(() =>
    import("./roles/MachineLearningPage").then(({ MachineLearningPage }) => ({
      default: MachineLearningPage,
    }))
  ),
  "product-design": lazy(() =>
    import("./roles/ProductDesignPage").then(({ ProductDesignPage }) => ({
      default: ProductDesignPage,
    }))
  ),
  postgresql: lazy(() =>
    import("./roles/PostgreSqlPage").then(({ PostgreSqlPage }) => ({ default: PostgreSqlPage }))
  ),
  ios: lazy(() => import("./roles/IosPage").then(({ IosPage }) => ({ default: IosPage }))),
  blockchain: lazy(() =>
    import("./roles/BlockchainPage").then(({ BlockchainPage }) => ({ default: BlockchainPage }))
  ),
  qa: lazy(() => import("./roles/QaPage").then(({ QaPage }) => ({ default: QaPage }))),
  "software-architect": lazy(() =>
    import("./roles/SoftwareArchitectPage").then(({ SoftwareArchitectPage }) => ({
      default: SoftwareArchitectPage,
    }))
  ),
  "cyber-security": lazy(() =>
    import("./roles/CyberSecurityPage").then(({ CyberSecurityPage }) => ({
      default: CyberSecurityPage,
    }))
  ),
  "ux-design": lazy(() =>
    import("./roles/UxDesignPage").then(({ UxDesignPage }) => ({ default: UxDesignPage }))
  ),
  "technical-writer": lazy(() =>
    import("./roles/TechnicalWriterPage").then(({ TechnicalWriterPage }) => ({
      default: TechnicalWriterPage,
    }))
  ),
  "game-developer": lazy(() =>
    import("./roles/GameDeveloperPage").then(({ GameDeveloperPage }) => ({
      default: GameDeveloperPage,
    }))
  ),
  "server-side-game-developer": lazy(() =>
    import("./roles/ServerSideGameDevPage").then(({ ServerSideGameDevPage }) => ({
      default: ServerSideGameDevPage,
    }))
  ),
  mlops: lazy(() => import("./roles/MlOpsPage").then(({ MlOpsPage }) => ({ default: MlOpsPage }))),
  "product-manager": lazy(() =>
    import("./roles/ProductManagerPage").then(({ ProductManagerPage }) => ({
      default: ProductManagerPage,
    }))
  ),
  "engineering-manager": lazy(() =>
    import("./roles/EngineeringManagerPage").then(({ EngineeringManagerPage }) => ({
      default: EngineeringManagerPage,
    }))
  ),
  "developer-relations": lazy(() =>
    import("./roles/DeveloperRelationsPage").then(({ DeveloperRelationsPage }) => ({
      default: DeveloperRelationsPage,
    }))
  ),
  "bi-analyst": lazy(() =>
    import("./roles/BiAnalystPage").then(({ BiAnalystPage }) => ({ default: BiAnalystPage }))
  ),
  "network-engineer": lazy(() =>
    import("./roles/NetworkEngineerPage").then(({ NetworkEngineerPage }) => ({
      default: NetworkEngineerPage,
    }))
  ),
  "forward-deployed-engineer": lazy(() =>
    import("./roles/ForwardDeployedEngineerPage").then(({ ForwardDeployedEngineerPage }) => ({
      default: ForwardDeployedEngineerPage,
    }))
  ),
  "skill-ai-agents": lazy(() =>
    import("./skills/AiAgentsPage").then(({ AiAgentsPage }) => ({ default: AiAgentsPage }))
  ),
  "skill-ai-product-builders": lazy(() =>
    import("./skills/AiProductBuildersPage").then(({ AiProductBuildersPage }) => ({
      default: AiProductBuildersPage,
    }))
  ),
  "skill-ai-red-teaming": lazy(() =>
    import("./skills/AiRedTeamingPage").then(({ AiRedTeamingPage }) => ({
      default: AiRedTeamingPage,
    }))
  ),
  "skill-angular": lazy(() =>
    import("./skills/AngularPage").then(({ AngularPage }) => ({ default: AngularPage }))
  ),
  "skill-api-design": lazy(() =>
    import("./skills/ApiDesignPage").then(({ ApiDesignPage }) => ({ default: ApiDesignPage }))
  ),
  "skill-aspnet-core": lazy(() =>
    import("./skills/AspNetCorePage").then(({ AspNetCorePage }) => ({ default: AspNetCorePage }))
  ),
  "skill-aws": lazy(() =>
    import("./skills/AwsSkillPage").then(({ AwsSkillPage }) => ({ default: AwsSkillPage }))
  ),
  "skill-c-programming": lazy(() =>
    import("./skills/CProgrammingPage").then(({ CProgrammingPage }) => ({
      default: CProgrammingPage,
    }))
  ),
  "skill-cpp": lazy(() => import("./skills/CppPage").then(({ CppPage }) => ({ default: CppPage }))),
  "skill-claude-code": lazy(() =>
    import("./skills/ClaudeCodePage").then(({ ClaudeCodePage }) => ({ default: ClaudeCodePage }))
  ),
  "skill-cloudflare": lazy(() =>
    import("./skills/CloudflarePage").then(({ CloudflarePage }) => ({ default: CloudflarePage }))
  ),
  "skill-code-review": lazy(() =>
    import("./skills/CodeReviewSkillPage").then(({ CodeReviewSkillPage }) => ({
      default: CodeReviewSkillPage,
    }))
  ),
  "skill-computer-science": lazy(() =>
    import("./skills/ComputerSciencePage").then(({ ComputerSciencePage }) => ({
      default: ComputerSciencePage,
    }))
  ),
  "skill-css": lazy(() => import("./skills/CssPage").then(({ CssPage }) => ({ default: CssPage }))),
  "skill-dsa": lazy(() => import("./skills/DsaPage").then(({ DsaPage }) => ({ default: DsaPage }))),
  "skill-design-architecture": lazy(() =>
    import("./skills/DesignArchitecturePage").then(({ DesignArchitecturePage }) => ({
      default: DesignArchitecturePage,
    }))
  ),
  "skill-design-system": lazy(() =>
    import("./skills/DesignSystemPage").then(({ DesignSystemPage }) => ({
      default: DesignSystemPage,
    }))
  ),
  "skill-django": lazy(() =>
    import("./skills/DjangoPage").then(({ DjangoPage }) => ({ default: DjangoPage }))
  ),
  "skill-docker": lazy(() =>
    import("./skills/DockerPage").then(({ DockerPage }) => ({ default: DockerPage }))
  ),
  "skill-elasticsearch": lazy(() =>
    import("./skills/ElasticsearchPage").then(({ ElasticsearchPage }) => ({
      default: ElasticsearchPage,
    }))
  ),
  "skill-flutter": lazy(() =>
    import("./skills/FlutterPage").then(({ FlutterPage }) => ({ default: FlutterPage }))
  ),
  "skill-git-github": lazy(() =>
    import("./skills/GitGithubPage").then(({ GitGithubPage }) => ({ default: GitGithubPage }))
  ),
  "skill-go": lazy(() => import("./skills/GoPage").then(({ GoPage }) => ({ default: GoPage }))),
  "skill-graphql": lazy(() =>
    import("./skills/GraphQlPage").then(({ GraphQlPage }) => ({ default: GraphQlPage }))
  ),
  "skill-html": lazy(() =>
    import("./skills/HtmlPage").then(({ HtmlPage }) => ({ default: HtmlPage }))
  ),
  "skill-java": lazy(() =>
    import("./skills/JavaPage").then(({ JavaPage }) => ({ default: JavaPage }))
  ),
  "skill-javascript": lazy(() =>
    import("./skills/JavaScriptPage").then(({ JavaScriptPage }) => ({ default: JavaScriptPage }))
  ),
  "skill-kotlin": lazy(() =>
    import("./skills/KotlinPage").then(({ KotlinPage }) => ({ default: KotlinPage }))
  ),
  "skill-kubernetes": lazy(() =>
    import("./skills/KubernetesPage").then(({ KubernetesPage }) => ({ default: KubernetesPage }))
  ),
  "skill-laravel": lazy(() =>
    import("./skills/LaravelPage").then(({ LaravelPage }) => ({ default: LaravelPage }))
  ),
  "skill-leetcode": lazy(() =>
    import("./skills/LeetCodePage").then(({ LeetCodePage }) => ({ default: LeetCodePage }))
  ),
  "skill-linux": lazy(() =>
    import("./skills/LinuxPage").then(({ LinuxPage }) => ({ default: LinuxPage }))
  ),
  "skill-mongodb": lazy(() =>
    import("./skills/MongoDbPage").then(({ MongoDbPage }) => ({ default: MongoDbPage }))
  ),
  "skill-nextjs": lazy(() =>
    import("./skills/NextJsPage").then(({ NextJsPage }) => ({ default: NextJsPage }))
  ),
  "skill-nodejs": lazy(() =>
    import("./skills/NodeJsPage").then(({ NodeJsPage }) => ({ default: NodeJsPage }))
  ),
  "skill-openclaw": lazy(() =>
    import("./skills/OpenClawPage").then(({ OpenClawPage }) => ({ default: OpenClawPage }))
  ),
  "skill-php": lazy(() => import("./skills/PhpPage").then(({ PhpPage }) => ({ default: PhpPage }))),
  "skill-power-bi": lazy(() =>
    import("./skills/PowerBiPage").then(({ PowerBiPage }) => ({ default: PowerBiPage }))
  ),
  "skill-prompt-engineering": lazy(() =>
    import("./skills/PromptEngineeringPage").then(({ PromptEngineeringPage }) => ({
      default: PromptEngineeringPage,
    }))
  ),
  "skill-python": lazy(() =>
    import("./skills/PythonPage").then(({ PythonPage }) => ({ default: PythonPage }))
  ),
  "skill-python-data-analysis": lazy(() =>
    import("./skills/PythonDataAnalysisPage").then(({ PythonDataAnalysisPage }) => ({
      default: PythonDataAnalysisPage,
    }))
  ),
  "skill-r-programming": lazy(() =>
    import("./skills/RProgrammingPage").then(({ RProgrammingPage }) => ({
      default: RProgrammingPage,
    }))
  ),
  "skill-react": lazy(() =>
    import("./skills/ReactSkillPage").then(({ ReactSkillPage }) => ({ default: ReactSkillPage }))
  ),
  "skill-react-native": lazy(() =>
    import("./skills/ReactNativePage").then(({ ReactNativePage }) => ({ default: ReactNativePage }))
  ),
  "skill-redis": lazy(() =>
    import("./skills/RedisPage").then(({ RedisPage }) => ({ default: RedisPage }))
  ),
  "skill-ruby": lazy(() =>
    import("./skills/RubyPage").then(({ RubyPage }) => ({ default: RubyPage }))
  ),
  "skill-ruby-on-rails": lazy(() =>
    import("./skills/RubyOnRailsPage").then(({ RubyOnRailsPage }) => ({ default: RubyOnRailsPage }))
  ),
  "skill-rust": lazy(() =>
    import("./skills/RustPage").then(({ RustPage }) => ({ default: RustPage }))
  ),
  "skill-scala": lazy(() =>
    import("./skills/ScalaPage").then(({ ScalaPage }) => ({ default: ScalaPage }))
  ),
  "skill-shell": lazy(() =>
    import("./skills/ShellPage").then(({ ShellPage }) => ({ default: ShellPage }))
  ),
  "skill-spring-boot": lazy(() =>
    import("./skills/SpringBootPage").then(({ SpringBootPage }) => ({ default: SpringBootPage }))
  ),
  "skill-sql": lazy(() => import("./skills/SqlPage").then(({ SqlPage }) => ({ default: SqlPage }))),
  "skill-swift": lazy(() =>
    import("./skills/SwiftPage").then(({ SwiftPage }) => ({ default: SwiftPage }))
  ),
  "skill-system-design": lazy(() =>
    import("./skills/SystemDesignPage").then(({ SystemDesignPage }) => ({
      default: SystemDesignPage,
    }))
  ),
  "skill-terraform": lazy(() =>
    import("./skills/TerraformPage").then(({ TerraformPage }) => ({ default: TerraformPage }))
  ),
  "skill-typescript": lazy(() =>
    import("./skills/TypeScriptPage").then(({ TypeScriptPage }) => ({ default: TypeScriptPage }))
  ),
  "skill-vibe-coding": lazy(() =>
    import("./skills/VibeCodingPage").then(({ VibeCodingPage }) => ({ default: VibeCodingPage }))
  ),
  "skill-vue": lazy(() => import("./skills/VuePage").then(({ VuePage }) => ({ default: VuePage }))),
  "skill-wordpress": lazy(() =>
    import("./skills/WordPressPage").then(({ WordPressPage }) => ({ default: WordPressPage }))
  ),
  "best-practice-aws": lazy(() =>
    import("./bestPractices/AwsBestPracticePage").then(({ AwsBestPracticePage }) => ({
      default: AwsBestPracticePage,
    }))
  ),
  "best-practice-api-security": lazy(() =>
    import("./bestPractices/ApiSecurityBestPracticePage").then(
      ({ ApiSecurityBestPracticePage }) => ({ default: ApiSecurityBestPracticePage })
    )
  ),
  "best-practice-backend-performance": lazy(() =>
    import("./bestPractices/BackendPerformanceBestPracticePage").then(
      ({ BackendPerformanceBestPracticePage }) => ({ default: BackendPerformanceBestPracticePage })
    )
  ),
  "best-practice-frontend-performance": lazy(() =>
    import("./bestPractices/FrontendPerformanceBestPracticePage").then(
      ({ FrontendPerformanceBestPracticePage }) => ({
        default: FrontendPerformanceBestPracticePage,
      })
    )
  ),
  "best-practice-code-review": lazy(() =>
    import("./bestPractices/CodeReviewBestPracticePage").then(({ CodeReviewBestPracticePage }) => ({
      default: CodeReviewBestPracticePage,
    }))
  ),
};

export function getRoadmapPageById(
  id: string
): LazyExoticComponent<ComponentType<RoadmapPageProps>> | undefined {
  return ROADMAP_PAGES[id];
}
