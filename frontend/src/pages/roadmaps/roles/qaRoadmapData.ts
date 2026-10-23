export type QaRoadmapStatus = "personal" | "alternative" | "optional";

export interface QaRoadmapNode {
  id: string;
  title: string;
  status?: QaRoadmapStatus;
  roadmapId?: string;
}

export interface QaRoadmapGroup {
  id: string;
  parent?: QaRoadmapNode;
  items: QaRoadmapNode[];
}

export interface QaRoadmapStage {
  id: string;
  node: QaRoadmapNode;
  left?: QaRoadmapGroup[];
  right?: QaRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface QaRoadmapSection {
  id: string;
  title?: string;
  stages: QaRoadmapStage[];
}

export interface QaRoadmapLink {
  label: string;
  roadmapId: string;
}

export const QA_MARKERS: Array<{
  status: QaRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const QA_RELATED_ROADMAPS: QaRoadmapLink[] = [
  { label: "Frontend", roadmapId: "frontend" },
  { label: "Backend", roadmapId: "backend" },
  { label: "DevOps", roadmapId: "devops" },
  { label: "JavaScript", roadmapId: "skill-javascript" },
  { label: "Node.js", roadmapId: "skill-nodejs" },
];

export const QA_CONTINUE_LEARNING: QaRoadmapLink[] = [
  { label: "Backend", roadmapId: "backend" },
  { label: "Full-stack", roadmapId: "full-stack" },
  { label: "DevOps", roadmapId: "devops" },
  { label: "Frontend", roadmapId: "frontend" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: QaRoadmapStatus,
  roadmapId?: string,
  customId?: string
): QaRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (items: QaRoadmapNode[], parent?: QaRoadmapNode, customId?: string): QaRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<QaRoadmapStage, "id" | "node"> & {
    status?: QaRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): QaRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

const FOUNDATIONS: QaRoadmapSection = {
  id: "foundations",
  title: "Foundations",
  stages: [
    stage("Learn the Fundamentals", {
      left: [
        g([n("What is Quality Assurance?"), n("QA Mindset")]),
        g(
          [n("White Box Testing"), n("Gray Box Testing"), n("Black Box Testing")],
          n("Testing Approaches", "personal", undefined, "grp-testing-approaches"),
          "grp-testing-approaches-box"
        ),
      ],
      right: [
        g([n("Test Oracles"), n("Test Prioritization")]),
        g(
          [n("Atlassian"), n("Assembla"), n("YouTrack"), n("Trello")],
          n("Project Management"),
          "grp-project-management"
        ),
        g(
          [
            n("qTest"),
            n("TestRail", "personal", undefined, "manage-testrail"),
            n("TestLink"),
            n("Zephyr"),
          ],
          n("Manage your Testing"),
          "grp-manage-your-testing"
        ),
      ],
    }),
  ],
};

const SDLC: QaRoadmapSection = {
  id: "sdlc-delivery-models",
  title: "Software Development Lifecycle",
  stages: [
    stage("SDLC Delivery Model", {
      left: [
        g(
          [n("Kanban", "personal"), n("Scrum", "personal"), n("XP"), n("SAFe")],
          n("Agile Model", "personal")
        ),
      ],
      right: [g([n("Waterfall"), n("V Model"), n("Spiral")], n("Traditional Models"))],
    }),
  ],
};

const METHODOLOGIES: QaRoadmapSection = {
  id: "testing-methodologies",
  title: "Testing Methodologies & Techniques",
  stages: [
    stage("Testing Methodologies", {
      left: [
        g(
          [n("TDD", "personal"), n("BDD", "alternative"), n("ATDD", "alternative"), n("RCA")],
          n("Development Methodologies")
        ),
      ],
      right: [
        g(
          [
            n("Unit Testing", "personal"),
            n("Integration Testing", "personal"),
            n("Smoke Testing", "personal"),
            n("Sanity Testing"),
            n("Regression Testing", "personal"),
            n("Exploratory Testing"),
            n("UAT"),
            n("Mocking"),
          ],
          n("Functional Testing", "personal")
        ),
        g(
          [
            n("Load Testing"),
            n("Performance Testing"),
            n("Stress Testing"),
            n("Security Testing", undefined, undefined, "tech-security-testing"),
            n("Accessibility Testing"),
          ],
          n("Non-Functional Testing")
        ),
      ],
    }),
  ],
};

const MANUAL_TESTING: QaRoadmapSection = {
  id: "manual-testing",
  title: "Manual Testing",
  stages: [
    stage("Manual Testing", {
      left: [
        g([
          n("Test Planning", "personal"),
          n("Test Cases and Scenarios", "personal"),
          n("Compatibility"),
          n("Verification and Validation"),
        ]),
      ],
      right: [
        g(
          [
            n("Functional Testing", undefined, undefined, "technique-functional"),
            n("Non-Functional Testing", undefined, undefined, "technique-non-functional"),
          ],
          n("Testing Techniques")
        ),
      ],
    }),
  ],
};

const AUTOMATED_TESTING: QaRoadmapSection = {
  id: "automated-testing",
  title: "Automated Testing",
  stages: [
    stage("Automated Testing", {
      left: [
        g(
          [
            n("Postman / Newman", "personal"),
            n("REST Assured", "personal"),
            n("Cypress", "alternative", undefined, "backend-cypress"),
            n("Playwright", "alternative", undefined, "backend-playwright"),
            n("Karateframework"),
            n("Soap UI"),
          ],
          n("Backend Automation", "personal")
        ),
      ],
      right: [
        g(
          [
            n("Browser / Dev Tools", "personal"),
            n("HTML, CSS, JavaScript", "personal", "skill-javascript"),
            n("Ajax"),
            n("Caching"),
            n("SWAs, PWAs, JAMStack"),
            n("CSR vs SSR"),
            n("Responsive vs Adaptive"),
          ],
          n("Basic Introduction")
        ),
        g(
          [
            n("Playwright", "personal", undefined, "frontend-playwright"),
            n("Cypress", "personal", undefined, "frontend-cypress"),
            n("Selenium", "alternative"),
            n("Webdriver.io", "alternative"),
            n("Jest", "alternative"),
            n("Puppeteer", "alternative", undefined, "frontend-puppeteer"),
            n("Jasmine"),
            n("Nightwatch"),
            n("QA Wolf"),
            n("Robot"),
          ],
          n("Automation Frameworks", "personal")
        ),
        g([n("Selenium IDE"), n("BugBug"), n("Ghost Inspector")], n("Browser Addons")),
      ],
    }),
  ],
};

const SPECIALIZED_TESTING: QaRoadmapSection = {
  id: "specialized-testing",
  title: "Specialized & Non-Functional Testing",
  stages: [
    stage("Accessibility Tests", {
      left: [
        g(
          [
            n("Appium", "personal"),
            n("Detox", "alternative"),
            n("Espresso", "alternative"),
            n("SwiftTesting", "alternative"),
          ],
          n("Mobile Automation", "personal")
        ),
      ],
      right: [
        g(
          [n("Wave", "personal"), n("AXE", "personal"), n("Chrome DevTools", "personal")],
          n("Accessibility Tools")
        ),
      ],
    }),
    stage("Load & Performance Testing", {
      left: [
        g(
          [
            n("Lighthouse", "personal"),
            n("K6", "personal"),
            n("JMeter", "alternative"),
            n("Gatling", "alternative"),
            n("Locust", "alternative"),
            n("Webpage Test"),
            n("Artillery"),
            n("Vegeta"),
          ],
          n("Performance & Load Tools")
        ),
      ],
    }),
    stage("Security Testing", {
      left: [
        g(
          [
            n("OWASP 10", "personal"),
            n("Authentication / Authorization", "personal"),
            n("Secrets Management", "personal"),
            n("Vulnerability Scanning", "personal"),
            n("Attack Vectors", "personal"),
          ],
          n("Security Domains")
        ),
      ],
      right: [
        g([n("Mailinator", "personal"), n("Gmail Tester", "alternative")], n("Email Testing")),
      ],
    }),
  ],
};

const REPORTING_AND_MONITORING: QaRoadmapSection = {
  id: "reporting-and-monitoring",
  title: "Test Data, Reporting & Monitoring",
  stages: [
    stage("Testing Data Management", {
      right: [g([n("Delphix", "personal")], n("Data Management Tools"))],
    }),
    stage("Reporting", {
      right: [
        g(
          [
            n("Allure", "personal"),
            n("TestRail", "alternative", undefined, "reporting-testrail"),
            n("jUnit", "alternative"),
          ],
          n("Reporting Frameworks")
        ),
      ],
    }),
    stage("Monitoring & Logs", {
      left: [
        g(
          [
            n("Datadog", "personal"),
            n("Sentry", "personal"),
            n("Grafana", "personal"),
            n("Kibana", "alternative"),
            n("New Relic", "alternative"),
            n("Pager Duty"),
            n("RunScope"),
          ],
          n("Monitoring & Observability")
        ),
      ],
    }),
  ],
};

const CICD_AND_HEADLESS: QaRoadmapSection = {
  id: "cicd-and-headless",
  title: "CI/CD & Headless Testing",
  stages: [
    stage("Version Control System", {
      right: [g([n("Git", "personal", "skill-git-github")])],
    }),
    stage("Repo Hosting Services", {
      left: [
        g(
          [n("GitHub", "personal"), n("GitLab", "alternative"), n("Bitbucket", "alternative")],
          n("Repo Hosting")
        ),
      ],
      right: [
        g(
          [
            n("Jenkins", "personal"),
            n("GitLab CI", "personal"),
            n("Circle CI", "alternative"),
            n("Travis CI", "alternative"),
            n("Bamboo"),
            n("Drone"),
            n("TeamCity"),
            n("Azure DevOps Services"),
          ],
          n("CI / CD", "personal")
        ),
      ],
    }),
    stage("Headless Testing", {
      left: [
        g(
          [
            n("Playwright", "personal", undefined, "headless-playwright"),
            n("Puppeteer", "personal", undefined, "headless-puppeteer"),
            n("Cypress", "alternative", undefined, "headless-cypress"),
            n("Headless Chrome", "personal"),
            n("Headless Fox"),
            n("Zombie.js"),
            n("HTML Unit"),
          ],
          n("Headless Browsers & Drivers")
        ),
      ],
      noteAfter:
        "Mastering automated testing, headless browser execution, and continuous integration pipelines ensures reliable, reproducible quality assurance for modern software products.",
      projectIdea: "Writing an end-to-end (e2e) test cases for an e-commerce app",
    }),
  ],
};

export const QA_SECTIONS: QaRoadmapSection[] = [
  FOUNDATIONS,
  SDLC,
  METHODOLOGIES,
  MANUAL_TESTING,
  AUTOMATED_TESTING,
  SPECIALIZED_TESTING,
  REPORTING_AND_MONITORING,
  CICD_AND_HEADLESS,
];
