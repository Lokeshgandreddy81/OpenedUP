import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useAppContext } from "./context/AppContext";
import { WorkspaceSyncModal } from "./components/WorkspaceSyncModal";

import { LandingPageSkeleton } from "./pages/LandingPage/LoadingSkeleton";
import { ResultsPageSkeleton } from "./pages/ResultsPage/LoadingSkeleton";
import { RoadmapPageSkeleton } from "./pages/RoadmapPage/LoadingSkeleton";
import { BenchmarksPageSkeleton } from "./pages/BenchmarksPage/LoadingSkeleton";
import { ChatPageSkeleton } from "./pages/ChatPage/LoadingSkeleton";
import { ProjectsPageSkeleton } from "./pages/ProjectsPage/LoadingSkeleton";
import { ScheduledPageSkeleton } from "./pages/ScheduledPage/LoadingSkeleton";
import { ImageArenaPageSkeleton } from "./pages/ImageArenaPage/LoadingSkeleton";
import { CodingAgentsPageSkeleton } from "./pages/CodingAgentsPage/LoadingSkeleton";

const LandingPage = lazy(() => import("./pages/LandingPage/LandingPage"));
const ResultsPage = lazy(() => import("./pages/ResultsPage/ResultsPage"));
const RoadmapPage = lazy(() => import("./pages/RoadmapPage/RoadmapPage"));
const BenchmarksPage = lazy(() => import("./pages/BenchmarksPage/BenchmarksPage"));
const ChatPage = lazy(() => import("./pages/ChatPage/ChatPage"));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage/ProjectsPage"));
const ScheduledPage = lazy(() => import("./pages/ScheduledPage/ScheduledPage"));
const ImageArenaPage = lazy(() => import("./pages/ImageArenaPage/ImageArenaPage"));
const CodingAgentsPage = lazy(() => import("./pages/CodingAgentsPage/CodingAgentsPage"));

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
            <Suspense fallback={<LandingPageSkeleton />}>
              <LandingPage />
            </Suspense>
          }
        />
        <Route
          path="/results"
          element={
            <Suspense fallback={<ResultsPageSkeleton />}>
              <ResultsPage />
            </Suspense>
          }
        />
        <Route
          path="/roadmap"
          element={
            <Suspense fallback={<RoadmapPageSkeleton />}>
              <RoadmapPage />
            </Suspense>
          }
        />
        <Route
          path="/benchmarks"
          element={
            <Suspense fallback={<BenchmarksPageSkeleton />}>
              <BenchmarksPage />
            </Suspense>
          }
        />
        <Route
          path="/chat"
          element={
            <Suspense fallback={<ChatPageSkeleton />}>
              <ChatPage />
            </Suspense>
          }
        />
        <Route
          path="/projects"
          element={
            <Suspense fallback={<ProjectsPageSkeleton />}>
              <ProjectsPage />
            </Suspense>
          }
        />
        <Route
          path="/scheduled"
          element={
            <Suspense fallback={<ScheduledPageSkeleton />}>
              <ScheduledPage />
            </Suspense>
          }
        />
        <Route
          path="/image-arena"
          element={
            <Suspense fallback={<ImageArenaPageSkeleton />}>
              <ImageArenaPage />
            </Suspense>
          }
        />
        <Route
          path="/coding-agents"
          element={
            <Suspense fallback={<CodingAgentsPageSkeleton />}>
              <CodingAgentsPage />
            </Suspense>
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
        <AppShell />
      </AppProvider>
    </BrowserRouter>
  );
}
