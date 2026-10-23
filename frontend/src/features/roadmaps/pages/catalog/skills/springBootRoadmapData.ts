export type SpringBootRoadmapStatus = "personal" | "alternative" | "optional";

export interface SpringBootRoadmapNode {
  id: string;
  title: string;
  status?: SpringBootRoadmapStatus;
  roadmapId?: string;
}

export interface SpringBootRoadmapGroup {
  id: string;
  parent?: SpringBootRoadmapNode;
  items: SpringBootRoadmapNode[];
}

export interface SpringBootRoadmapStage {
  id: string;
  node: SpringBootRoadmapNode;
  left?: SpringBootRoadmapGroup[];
  right?: SpringBootRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface SpringBootRoadmapSection {
  id: string;
  title?: string;
  stages: SpringBootRoadmapStage[];
}

export interface SpringBootRoadmapLink {
  label: string;
  roadmapId: string;
}

export const SPRING_BOOT_MARKERS: Array<{
  status: SpringBootRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const SPRING_BOOT_RELATED_ROADMAPS: SpringBootRoadmapLink[] = [
  { label: "Java Roadmap", roadmapId: "skill-java" },
  { label: "Backend Developer", roadmapId: "backend" },
  { label: "API Design", roadmapId: "skill-api-design" },
  { label: "PostgreSQL DBA", roadmapId: "postgresql" },
  { label: "Docker Roadmap", roadmapId: "skill-docker" },
  { label: "Software Architect", roadmapId: "software-architect" },
];

export const SPRING_BOOT_CONTINUE_LEARNING: SpringBootRoadmapLink[] = [
  { label: "Java", roadmapId: "skill-java" },
  { label: "Backend Developer", roadmapId: "backend" },
  { label: "Software Architect", roadmapId: "software-architect" },
  { label: "System Design", roadmapId: "skill-system-design" },
  { label: "DevOps", roadmapId: "devops" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: SpringBootRoadmapStatus,
  roadmapId?: string,
  customId?: string
): SpringBootRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: SpringBootRoadmapNode[],
  parent?: SpringBootRoadmapNode,
  customId?: string
): SpringBootRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<SpringBootRoadmapStage, "id" | "node"> & {
    status?: SpringBootRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): SpringBootRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

// 1. CORE SPRING & INVERSION OF CONTROL
const CORE_SPRING_AND_IOC: SpringBootRoadmapSection = {
  id: "core-spring-and-ioc",
  title: "Core Spring & Inversion of Control",
  stages: [
    stage("IoC Container & Dependency Injection", {
      status: "personal",
      left: [
        g(
          [
            n("Inversion of Control (IoC) Principle", "personal"),
            n("ApplicationContext & BeanFactory"),
            n("Spring Bean Registry & Container"),
            n("ClassPathScanningCandidateComponentProvider"),
          ],
          n("IoC Container Foundations")
        ),
      ],
      right: [
        g(
          [
            n("Constructor Injection (Best Practice)", "personal"),
            n("Setter Injection (Optional Dependencies)"),
            n("Field Injection (@Autowired - Not Recommended)"),
            n("Circular Dependency Detection & Resolution"),
          ],
          n("Dependency Injection Strategies")
        ),
      ],
      noteAfter:
        "Always prioritize Constructor Injection: it guarantees immutability, facilitates unit testing without Spring, and prevents circular dependencies at startup.",
    }),
    stage("Stereotypes & Bean Lifecycle", {
      status: "personal",
      left: [
        g(
          [
            n("@Component (Generic Spring Bean)"),
            n("@Service (Business Layer)", "personal"),
            n("@Repository (DAO & Data Layer)", "personal"),
            n("@Configuration & @Bean Definitions", "personal"),
          ],
          n("Stereotype Annotations")
        ),
      ],
      right: [
        g(
          [
            n("Bean Scopes (Singleton, Prototype)", "personal"),
            n("Lifecycle: @PostConstruct & @PreDestroy", "personal"),
            n("@Primary & @Qualifier disambiguation", "personal"),
            n("@Lazy Bean Initialization"),
          ],
          n("Bean Lifecycle & Resolution")
        ),
      ],
      projectIdea:
        "DI Showcase: Implement a notification dispatch engine demonstrating @Component, @Primary/@Qualifier switching, and lifecycle initialization callbacks",
    }),
  ],
};

// 2. SPRING BOOT FUNDAMENTALS
const SPRING_BOOT_FUNDAMENTALS: SpringBootRoadmapSection = {
  id: "spring-boot-fundamentals",
  title: "Spring Boot Fundamentals & Configuration",
  stages: [
    stage("Auto-Configuration & Starters", {
      status: "personal",
      left: [
        g(
          [
            n("@SpringBootApplication Meta-Annotation", "personal"),
            n("@EnableAutoConfiguration Mechanism", "personal"),
            n("@ConditionalOnClass & @ConditionalOnProperty"),
            n("Executable Fat JAR & Spring Boot Loader"),
          ],
          n("Auto-Configuration Architecture")
        ),
      ],
      right: [
        g(
          [
            n("Spring Initializr (start.spring.io)", "personal"),
            n("spring-boot-starter-web", "personal"),
            n("spring-boot-starter-data-jpa", "personal"),
            n("spring-boot-starter-validation"),
          ],
          n("Spring Boot Starters & CLI")
        ),
      ],
      noteAfter:
        "Spring Boot starter dependencies bundle compatible transitive dependencies and trigger sensible auto-configurations out of the box.",
    }),
    stage("Externalized Configuration & Profiles", {
      status: "personal",
      left: [
        g(
          [
            n("application.properties vs application.yml", "personal"),
            n("Property Precedence & Hierarchy"),
            n("Command-Line & Environment Overrides", "personal"),
            n("Spring Cloud Config / Vault integration"),
          ],
          n("Configuration Sources")
        ),
      ],
      right: [
        g(
          [
            n("@Value Annotation for Property Injection"),
            n("@ConfigurationProperties (Type-safe Config)", "personal"),
            n("Java 17+ Records as Config Properties", "personal"),
            n("Environment Profiles (@Profile, spring.profiles.active)", "personal"),
          ],
          n("Type-Safe Properties & Profiles")
        ),
      ],
      projectIdea:
        "Multi-Environment Service: Configure an application switching database credentials and payment gateways across dev, test, and prod profiles using @ConfigurationProperties",
    }),
  ],
};

// 3. RESTFUL APIS WITH SPRING MVC
const RESTFUL_APIS: SpringBootRoadmapSection = {
  id: "restful-apis",
  title: "RESTful Web APIs with Spring MVC",
  stages: [
    stage("REST Controllers & Endpoint Mapping", {
      status: "personal",
      left: [
        g(
          [
            n("@RestController & @ResponseBody", "personal"),
            n("@RequestMapping & URI Templates"),
            n("@GetMapping, @PostMapping, @PutMapping", "personal"),
            n("@DeleteMapping & @PatchMapping", "personal"),
          ],
          n("Controllers & HTTP Verbs")
        ),
      ],
      right: [
        g(
          [
            n("@PathVariable & @RequestParam", "personal"),
            n("@RequestBody & @RequestHeader"),
            n("ResponseEntity<T> & HTTP Status Codes", "personal"),
            n("Content Negotiation (JSON, XML)"),
          ],
          n("Request Parameters & Responses")
        ),
      ],
      noteAfter:
        "Return `ResponseEntity<T>` with accurate HTTP status codes (201 Created, 204 No Content, 404 Not Found) for standards-compliant REST design.",
    }),
    stage("DTOs, Validation & Exception Handling", {
      status: "personal",
      left: [
        g(
          [
            n("DTO Pattern & Entity Decoupling", "personal"),
            n("Java Records for Immutable DTOs", "personal"),
            n("MapStruct Object Mapping Library", "personal"),
            n("Jakarta Validation (@Valid, @NotNull, @Size)", "personal"),
          ],
          n("DTOs & Input Validation")
        ),
      ],
      right: [
        g(
          [
            n("@RestControllerAdvice / @ControllerAdvice", "personal"),
            n("@ExceptionHandler Methods", "personal"),
            n("RFC 7807 ProblemDetail Standard", "personal"),
            n("Standardized API Error Response Schema"),
          ],
          n("Global Exception Handling")
        ),
      ],
      projectIdea:
        "E-Commerce REST API: Build product catalog and order management CRUD endpoints with Bean Validation, MapStruct mapping, and RFC 7807 ProblemDetail responses",
    }),
  ],
};

// 4. DATA ACCESS WITH SPRING DATA JPA
const DATA_ACCESS: SpringBootRoadmapSection = {
  id: "data-access",
  title: "Data Access with Spring Data JPA",
  stages: [
    stage("JPA Entities & Relational Mapping", {
      status: "personal",
      left: [
        g(
          [
            n("JPA & Hibernate ORM Architecture", "personal"),
            n("@Entity, @Table & @Id Primary Keys", "personal"),
            n("@GeneratedValue Strategies (IDENTITY, SEQUENCE)", "personal"),
            n("@Column, @Enumerated & @Temporal"),
          ],
          n("Entities & Primary Keys")
        ),
      ],
      right: [
        g(
          [
            n("@ManyToOne & @OneToMany Relationships", "personal"),
            n("@ManyToMany & Composite Keys"),
            n("FetchType.LAZY vs EAGER & N+1 Problem", "personal"),
            n("CascadeType & orphanRemoval"),
          ],
          n("Relationship Mapping")
        ),
      ],
      noteAfter:
        "Default to `FetchType.LAZY` for all relational mappings to prevent unintentional N+1 queries from choking your database.",
    }),
    stage("Repositories & Transaction Management", {
      status: "personal",
      left: [
        g(
          [
            n("JpaRepository & CrudRepository", "personal"),
            n("Derived Query Methods (findBy...)", "personal"),
            n("Pagination & Sorting (Pageable, Page<T>)", "personal"),
            n("Specifications & Criteria API for Dynamic Queries"),
          ],
          n("Spring Data Repositories")
        ),
      ],
      right: [
        g(
          [
            n("@Query (JPQL & Native SQL Queries)", "personal"),
            n("@Modifying for Updates/Deletes"),
            n("@Transactional Declarative Transactions", "personal"),
            n("Transaction Propagation & Isolation Levels", "personal"),
          ],
          n("Queries & Transaction Management")
        ),
      ],
      projectIdea:
        "Inventory Management Engine: Build paginated inventory search using JpaRepository derived queries, native queries, and transactional stock deductions",
    }),
  ],
};

// 5. SECURITY WITH SPRING SECURITY
const SECURITY_SPRING_SECURITY: SpringBootRoadmapSection = {
  id: "security-spring-security",
  title: "Security with Spring Security",
  stages: [
    stage("Security Architecture & Filter Chains", {
      status: "personal",
      left: [
        g(
          [
            n("SecurityFilterChain Bean Configuration", "personal"),
            n("HttpSecurity Lambda DSL (Spring Security 6)", "personal"),
            n("DelegatingFilterProxy & Filter Chain", "personal"),
            n("CORS & CSRF Configuration"),
          ],
          n("Filter Chain & Architecture")
        ),
      ],
      right: [
        g(
          [
            n("UserDetailsService & UserDetails", "personal"),
            n("PasswordEncoder (BCryptPasswordEncoder)", "personal"),
            n("AuthenticationManager & AuthenticationProvider"),
            n("SessionCreationPolicy.STATELESS", "personal"),
          ],
          n("Authentication Infrastructure")
        ),
      ],
      noteAfter:
        "Spring Security 6 enforces stateless SecurityFilterChain beans using functional lambda DSLs without WebSecurityConfigurerAdapter.",
    }),
    stage("JWT, OAuth2 & Method Security", {
      status: "personal",
      left: [
        g(
          [
            n("JSON Web Tokens (JWT) Architecture", "personal"),
            n("Custom OncePerRequestFilter for JWT Verification", "personal"),
            n("Access Tokens & Refresh Token Rotation", "personal"),
            n("Token Revocation & Blacklisting Strategies"),
          ],
          n("JWT Authentication")
        ),
      ],
      right: [
        g(
          [
            n("OAuth2 Resource Server (spring-security-oauth2)", "personal"),
            n("OpenID Connect (OIDC) & Keycloak / Auth0"),
            n("Role-Based Access Control (RBAC)", "personal"),
            n("@PreAuthorize & @Secured Method Security", "personal"),
          ],
          n("OAuth2 & Authorization")
        ),
      ],
      projectIdea:
        "Secure SaaS Auth Gateway: Implement stateless JWT authentication with refresh token cookies, BCrypt password hashing, and role-based route guards",
    }),
  ],
};

// 6. TESTING & PRODUCTION MONITORING
const TESTING_AND_MONITORING: SpringBootRoadmapSection = {
  id: "testing-and-monitoring",
  title: "Testing & Production Observability",
  stages: [
    stage("Unit, Slice & Integration Testing", {
      status: "personal",
      left: [
        g(
          [
            n("@SpringBootTest Full Context Testing", "personal"),
            n("@WebMvcTest for Controller Slices", "personal"),
            n("@DataJpaTest for Repository Slices", "personal"),
            n("MockMvc for HTTP Endpoint Simulation", "personal"),
          ],
          n("Spring Boot Test Slices")
        ),
      ],
      right: [
        g(
          [
            n("@MockBean & Mockito Mocking", "personal"),
            n("AssertJ Fluent Assertions", "personal"),
            n("Testcontainers (Real PostgreSQL in Docker)", "personal"),
            n("WireMock for External REST Service Stubs"),
          ],
          n("Mocking & Testcontainers")
        ),
      ],
      noteAfter:
        "Use sliced tests (`@WebMvcTest`, `@DataJpaTest`) for rapid feedback and `Testcontainers` for dependable database integration testing without H2 discrepancies.",
    }),
    stage("Actuator, Metrics & Observability", {
      status: "personal",
      left: [
        g(
          [
            n("Spring Boot Actuator (/actuator)", "personal"),
            n("/actuator/health & Readiness / Liveness Probes", "personal"),
            n("/actuator/info, /metrics & /prometheus", "personal"),
            n("Custom HealthIndicator & Metrics"),
          ],
          n("Spring Boot Actuator")
        ),
      ],
      right: [
        g(
          [
            n("Micrometer & Prometheus Scraping", "personal"),
            n("Grafana Dashboards for JVM Monitoring", "personal"),
            n("Distributed Tracing with Micrometer Tracing / Zipkin"),
            n("Docker Containerization & Multi-Stage Builds", "personal"),
          ],
          n("Observability & Deployment")
        ),
      ],
      projectIdea:
        "Production-Ready Microservice: Package a containerized Spring Boot service equipped with Kubernetes probes, Actuator metrics, and a Prometheus/Grafana dashboard",
    }),
  ],
};

export const SPRING_BOOT_SECTIONS: SpringBootRoadmapSection[] = [
  CORE_SPRING_AND_IOC,
  SPRING_BOOT_FUNDAMENTALS,
  RESTFUL_APIS,
  DATA_ACCESS,
  SECURITY_SPRING_SECURITY,
  TESTING_AND_MONITORING,
];
