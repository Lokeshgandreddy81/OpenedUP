import React from "react";
import { PageRoute } from "../../../../app/components/PageRoute";
import { lazyWithRetry } from "../../../../app/components/lazyWithRetry";
import { ChatScreenLoading } from "./screens/ChatScreenLoading";
import type { CustomizeCategory } from "../../../customize";

const ProjectsScreen = lazyWithRetry(() =>
  import("../../../projects").then((feature) => ({ default: feature.ProjectsScreen }))
);
const ArtifactsScreen = lazyWithRetry(() => import("../../../artifacts"));
const CustomizeScreen = lazyWithRetry(() => import("../../../customize"));
const PluginsScreen = lazyWithRetry(() => import("../../../plugins"));
const BenchmarksScreen = lazyWithRetry(() =>
  import("../../../benchmarks").then((feature) => ({ default: feature.ChatBenchmarksScreen }))
);
const RoadmapsScreen = lazyWithRetry(() =>
  import("../../../roadmaps").then((feature) => ({ default: feature.RoadmapsScreen }))
);
const ScheduledTasksScreen = lazyWithRetry(() =>
  import("../../../scheduled").then((feature) => ({ default: feature.ChatScheduledTasksScreen }))
);

export type ChatWorkspaceView =
  | "chat"
  | "projects"
  | "artifacts"
  | "customize"
  | "plugins"
  | "benchmarks"
  | "chapters"
  | "roadmaps";

export interface ChatWorkspaceScreensProps {
  activeView: ChatWorkspaceView;
  customizeInitialCategory: CustomizeCategory;
  projectsNavKey: number;
  isScheduledTasksOpen: boolean;
  onSelectView: (view: "chat") => void;
  onNavigateToChat: (prompt?: string) => void;
  onCloseScheduledTasks: () => void;
  onOpenProviders: () => void;
  onOpenProjects: () => void;
  onOpenPlugins: () => void;
  onOpenBenchmarks: () => void;
  onOpenArtifacts: () => void;
}

export const ChatWorkspaceScreens: React.FC<ChatWorkspaceScreensProps> = ({
  activeView,
  customizeInitialCategory,
  projectsNavKey,
  isScheduledTasksOpen,
  onSelectView,
  onNavigateToChat,
  onCloseScheduledTasks,
  onOpenProviders,
  onOpenProjects,
  onOpenPlugins,
  onOpenBenchmarks,
  onOpenArtifacts,
}) => {
  let screen: React.ReactNode = null;

  switch (activeView) {
    case "projects":
      screen = (
        <PageRoute
          key={activeView}
          name="Projects"
          fallback={<ChatScreenLoading name="Projects" />}
        >
          <ProjectsScreen
            key={projectsNavKey}
            onOpenProviders={onOpenProviders}
            onOpenProjects={onOpenProjects}
            onOpenPlugins={onOpenPlugins}
            onOpenBenchmarks={onOpenBenchmarks}
            onOpenArtifacts={onOpenArtifacts}
          />
        </PageRoute>
      );
      break;
    case "artifacts":
      screen = (
        <PageRoute
          key={activeView}
          name="Artifacts"
          fallback={<ChatScreenLoading name="Artifacts" />}
        >
          <ArtifactsScreen onNavigateToChat={onNavigateToChat} />
        </PageRoute>
      );
      break;
    case "customize":
      screen = (
        <PageRoute
          key={activeView}
          name="Customize"
          fallback={<ChatScreenLoading name="Customize" />}
        >
          <CustomizeScreen initialCategory={customizeInitialCategory} />
        </PageRoute>
      );
      break;
    case "plugins":
      screen = (
        <PageRoute key={activeView} name="Plugins" fallback={<ChatScreenLoading name="Plugins" />}>
          <PluginsScreen />
        </PageRoute>
      );
      break;
    case "benchmarks":
      screen = (
        <PageRoute
          key={activeView}
          name="Benchmarks"
          fallback={<ChatScreenLoading name="Benchmarks" />}
        >
          <BenchmarksScreen onClose={() => onSelectView("chat")} />
        </PageRoute>
      );
      break;
    case "roadmaps":
      screen = (
        <PageRoute
          key={activeView}
          name="Roadmaps"
          fallback={<ChatScreenLoading name="Roadmaps" />}
        >
          <RoadmapsScreen onBack={() => onSelectView("chat")} />
        </PageRoute>
      );
      break;
    default:
      break;
  }

  return (
    <>
      {screen}
      {isScheduledTasksOpen && (
        <PageRoute name="Scheduled tasks" fallback={<ChatScreenLoading name="Scheduled tasks" />}>
          <ScheduledTasksScreen
            onClose={onCloseScheduledTasks}
            onNavigateToProviders={() => {
              onCloseScheduledTasks();
              onOpenProviders();
            }}
            onNavigateToChat={(prompt) => {
              onCloseScheduledTasks();
              onNavigateToChat(prompt);
            }}
          />
        </PageRoute>
      )}
    </>
  );
};

export default ChatWorkspaceScreens;
