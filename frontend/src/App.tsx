import React, { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
  useNavigationType,
} from "react-router-dom";
import { AppProvider, useAppContext, WorkspaceSyncModal } from "./features/chapters/publicApi";
import { ChatAuthProvider } from "./app/auth/ChatAuthContext";
import { useChatAuth } from "./app/auth/useChatAuth";
import { RequireAuth } from "./app/auth/RequireAuth";
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
  import("./features/chapters/pages/publicApi").then(({ FeaturesPage }) => ({
    default: FeaturesPage,
  }))
);
const InsightsPage = lazyWithRetry(() =>
  import("./features/chapters/pages/publicApi").then(({ InsightsPage }) => ({
    default: InsightsPage,
  }))
);
const DocsPage = lazyWithRetry(() =>
  import("./features/chapters/pages/publicApi").then(({ DocsPage }) => ({
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
const AuthPage = lazyWithRetry(() =>
  import("./features/auth/pages/AuthPage").then(({ AuthPage }) => ({ default: AuthPage }))
);
const VerifyEmailPage = lazyWithRetry(() =>
  import("./features/auth/pages/VerifyEmailPage").then(({ VerifyEmailPage }) => ({
    default: VerifyEmailPage,
  }))
);
const AuthCallbackPage = lazyWithRetry(() =>
  import("./features/auth/pages/AuthCallbackPage").then(({ AuthCallbackPage }) => ({
    default: AuthCallbackPage,
  }))
);
const ResetPasswordPage = lazyWithRetry(() =>
  import("./features/auth/pages/ResetPasswordPage").then(({ ResetPasswordPage }) => ({
    default: ResetPasswordPage,
  }))
);

const HomeRoute: React.FC<{ allowChatClose?: boolean }> = ({ allowChatClose = false }) => {
  const { user, loading } = useChatAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const isChatCloseLanding =
    allowChatClose && navigationType === "REPLACE" && location.state?.source === "chat-close";

  useEffect(() => {
    if (!user || !isChatCloseLanding) return;

    // Safari can keep this in-app landing route mounted while its tab is in the background.
    const resumeChat = () => {
      if (document.visibilityState === "visible") {
        navigate(user.emailVerified ? "/chat" : "/verify-email", { replace: true });
      }
    };

    window.addEventListener("focus", resumeChat);
    document.addEventListener("visibilitychange", resumeChat);
    return () => {
      window.removeEventListener("focus", resumeChat);
      document.removeEventListener("visibilitychange", resumeChat);
    };
  }, [isChatCloseLanding, navigate, user]);

  if (loading) return <LandingPageSkeleton />;
  if (user && !isChatCloseLanding) {
    return <Navigate to={user.emailVerified ? "/chat" : "/verify-email"} replace />;
  }

  return (
    <PageRoute name="Home" fallback={<LandingPageSkeleton />}>
      <LandingPage />
    </PageRoute>
  );
};

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
          path="/sign-in"
          element={
            <PageRoute name="Sign in" fallback={<div className="min-h-screen bg-[#fbfcfe]" />}>
              <AuthPage mode="sign-in" />
            </PageRoute>
          }
        />
        <Route
          path="/create-account"
          element={
            <PageRoute
              name="Create account"
              fallback={<div className="min-h-screen bg-[#fbfcfe]" />}
            >
              <AuthPage mode="create-account" />
            </PageRoute>
          }
        />
        <Route
          path="/verify-email"
          element={
            <PageRoute name="Verify email" fallback={<div className="min-h-screen bg-[#fbfcfe]" />}>
              <VerifyEmailPage />
            </PageRoute>
          }
        />
        <Route
          path="/auth/callback"
          element={
            <PageRoute
              name="Finishing sign in"
              fallback={<div className="min-h-screen bg-[#fbfcfe]" />}
            >
              <AuthCallbackPage />
            </PageRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PageRoute
              name="Reset password"
              fallback={<div className="min-h-screen bg-[#fbfcfe]" />}
            >
              <ResetPasswordPage />
            </PageRoute>
          }
        />
        <Route path="/login" element={<Navigate to="/sign-in" replace />} />
        <Route path="/signup" element={<Navigate to="/create-account" replace />} />
        <Route path="/" element={<HomeRoute />} />
        <Route path="/welcome" element={<HomeRoute allowChatClose />} />
        <Route element={<RequireAuth />}>
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
        </Route>
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
