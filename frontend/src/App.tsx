import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useAppContext, WorkspaceSyncModal } from "./features/chapters/publicApi";
import { ChatAuthProvider } from "./app/auth/ChatAuthContext";
import { PageRoute } from "./app/components/PageRoute";
import { lazyWithRetry } from "./app/components/lazyWithRetry";

import { LandingPageSkeleton } from "./features/chapters/pages/LandingPage/loading";
import { ResultsPageSkeleton } from "./features/chapters/pages/ResultsPage/loading";
import { RoadmapPageSkeleton } from "./features/roadmaps/pages/RoadmapPage/loading";
import { BenchmarksPageSkeleton } from "./features/benchmarks/pages/BenchmarksPage/loading";
import { ChatPageSkeleton } from "./features/chat/pages/ChatPage/loading";
import { ProjectsPageSkeleton } from "./features/projects/pages/ProjectsPage/loading";
import { ScheduledPageSkeleton } from "./features/scheduled/pages/ScheduledPage/loading";
import { CodingAgentsPageSkeleton } from "./features/benchmarks/pages/CodingAgentsPage/loading";

const LandingPage = lazyWithRetry(() =>
  import("./features/chapters/pages/LandingPage").then(({ LandingPage }) => ({
    default: LandingPage,
  }))
);
const FeaturesPage = lazyWithRetry(() =>
  import("./features/chapters/pages/FeaturesPage").then(({ FeaturesPage }) => ({
    default: FeaturesPage,
  }))
);
const InsightsPage = lazyWithRetry(() =>
  import("./features/chapters/pages/InsightsPage").then(({ InsightsPage }) => ({
    default: InsightsPage,
  }))
);
const DocsPage = lazyWithRetry(() =>
  import("./features/chapters/pages/DocsPage").then(({ DocsPage }) => ({
    default: DocsPage,
  }))
);
const ResultsPage = lazyWithRetry(() =>
  import("./features/chapters/pages/ResultsPage").then(({ ResultsPage }) => ({
    default: ResultsPage,
  }))
);
const RoadmapPage = lazyWithRetry(() =>
  import("./features/roadmaps/pages/RoadmapPage").then(({ RoadmapPage }) => ({
    default: RoadmapPage,
  }))
);
const BenchmarksPage = lazyWithRetry(() =>
  import("./features/benchmarks/pages/BenchmarksPage").then(({ BenchmarksPage }) => ({
    default: BenchmarksPage,
  }))
);
const ChatPage = lazyWithRetry(() =>
  import("./features/chat/pages/ChatPage").then(({ ChatPage }) => ({ default: ChatPage }))
);
const ProjectsPage = lazyWithRetry(() =>
  import("./features/projects/pages/ProjectsPage").then(({ ProjectsPage }) => ({
    default: ProjectsPage,
  }))
);
const ScheduledPage = lazyWithRetry(() =>
  import("./features/scheduled/pages/ScheduledPage").then(({ ScheduledPage }) => ({
    default: ScheduledPage,
  }))
);
const CodingAgentsPage = lazyWithRetry(() =>
  import("./features/benchmarks/pages/CodingAgentsPage").then(({ CodingAgentsPage }) => ({
    default: CodingAgentsPage,
  }))
);

export const AppShell: React.FC = () => {
  const {
    engineOutput,
    isWorkspaceModalOpen,
    setIsWorkspaceModalOpen,
    handleIngestWorkspaceFiles,
    connectedEmail,
    setConnectedEmail,
  } = useAppContext();

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <PageRoute name="Home" fallback={<LandingPageSkeleton />}>
              <LandingPage />
            </PageRoute>
          }
        />
        <Route
          path="/features"
          element={
            <PageRoute name="Features" fallback={<LandingPageSkeleton />}>
              <FeaturesPage />
            </PageRoute>
          }
        />
        <Route
          path="/insights"
          element={
            <PageRoute name="Insights" fallback={<LandingPageSkeleton />}>
              <InsightsPage />
            </PageRoute>
          }
        />
        <Route
          path="/docs"
          element={
            <PageRoute name="Docs" fallback={<LandingPageSkeleton />}>
              <DocsPage />
            </PageRoute>
          }
        />
        <Route
          path="/results"
          element={
            <PageRoute name="Results" fallback={<ResultsPageSkeleton />}>
              <ResultsPage />
            </PageRoute>
          }
        />
        <Route
          path="/roadmap"
          element={
            <PageRoute name="Roadmap" fallback={<RoadmapPageSkeleton />}>
              <RoadmapPage />
            </PageRoute>
          }
        />
        <Route
          path="/benchmarks"
          element={
            <PageRoute name="Benchmarks" fallback={<BenchmarksPageSkeleton />}>
              <BenchmarksPage />
            </PageRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <PageRoute name="Chat" fallback={<ChatPageSkeleton />}>
              <ChatPage chapters={engineOutput.computedRows} />
            </PageRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <PageRoute name="Projects" fallback={<ProjectsPageSkeleton />}>
              <ProjectsPage />
            </PageRoute>
          }
        />
        <Route
          path="/scheduled"
          element={
            <PageRoute name="Scheduled tasks" fallback={<ScheduledPageSkeleton />}>
              <ScheduledPage />
            </PageRoute>
          }
        />
        <Route path="/image-arena" element={<Navigate to="/benchmarks" replace />} />
        <Route
          path="/coding-agents"
          element={
            <PageRoute name="Coding agents" fallback={<CodingAgentsPageSkeleton />}>
              <CodingAgentsPage />
            </PageRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <WorkspaceSyncModal
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
        onIngestFiles={handleIngestWorkspaceFiles}
        connectedEmail={connectedEmail}
        onConnectedEmailChange={setConnectedEmail}
      />
    </>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <ChatAuthProvider>
          <AppShell />
        </ChatAuthProvider>
      </AppProvider>
    </BrowserRouter>
  );
}
