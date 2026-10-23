import React, { lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useAppContext } from "./features/chapters/state/AppContext";
import { ChatAuthProvider } from "./app/auth/ChatAuthContext";
import { WorkspaceSyncModal } from "./features/chapters/components/WorkspaceSyncModal";
import { PageRoute } from "./app/components/PageRoute";

import { LandingPageSkeleton } from "./features/chapters/pages/LandingPage/LoadingSkeleton";
import { ResultsPageSkeleton } from "./features/chapters/pages/ResultsPage/LoadingSkeleton";
import { RoadmapPageSkeleton } from "./features/roadmaps/pages/RoadmapPage/LoadingSkeleton";
import { BenchmarksPageSkeleton } from "./features/benchmarks/pages/BenchmarksPage/LoadingSkeleton";
import { ChatPageSkeleton } from "./features/chat/pages/ChatPage/LoadingSkeleton";
import { ProjectsPageSkeleton } from "./features/projects/pages/ProjectsPage/LoadingSkeleton";
import { ScheduledPageSkeleton } from "./features/scheduled/pages/ScheduledPage/LoadingSkeleton";
import { ImageArenaPageSkeleton } from "./features/benchmarks/pages/ImageArenaPage/LoadingSkeleton";
import { CodingAgentsPageSkeleton } from "./features/benchmarks/pages/CodingAgentsPage/LoadingSkeleton";

const LandingPage = lazy(() => import("./features/chapters/pages/LandingPage/LandingPage"));
const ResultsPage = lazy(() => import("./features/chapters/pages/ResultsPage/ResultsPage"));
const RoadmapPage = lazy(() => import("./features/roadmaps/pages/RoadmapPage/RoadmapPage"));
const BenchmarksPage = lazy(() => import("./features/benchmarks/pages/BenchmarksPage/BenchmarksPage"));
const ChatPage = lazy(() => import("./features/chat/pages/ChatPage/ChatPage"));
const ProjectsPage = lazy(() => import("./features/projects/pages/ProjectsPage/ProjectsPage"));
const ScheduledPage = lazy(() => import("./features/scheduled/pages/ScheduledPage/ScheduledPage"));
const ImageArenaPage = lazy(() => import("./features/benchmarks/pages/ImageArenaPage/ImageArenaPage"));
const CodingAgentsPage = lazy(() => import("./features/benchmarks/pages/CodingAgentsPage/CodingAgentsPage"));

export const AppShell: React.FC = () => {
  const {
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
              <ChatPage />
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
        <Route
          path="/image-arena"
          element={
            <PageRoute name="Image arena" fallback={<ImageArenaPageSkeleton />}>
              <ImageArenaPage />
            </PageRoute>
          }
        />
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
