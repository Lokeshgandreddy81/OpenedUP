import React from "react";
import { PageRoute } from "../../../../app/components/PageRoute";
import { lazyWithRetry } from "../../../../app/components/lazyWithRetry";
import { ChatScreenLoading } from "./screens/ChatScreenLoading";
import type { CustomizeCategory } from "../../../customize";
import type { ChatConversation } from "../../components/chatTypes";
import { ArchivedChatsScreen } from "../../components/ArchivedChatsScreen";

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
const ChaptersScreen = lazyWithRetry(() =>
  import("../../../chapters/publicApi").then((feature) => ({
    default: feature.ChatChaptersScreen,
  }))
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
  | "roadmaps"
  | "scheduled"
  | "archived";

export interface ChatWorkspaceScreensProps {
  activeView: ChatWorkspaceView;
  customizeInitialCategory: CustomizeCategory;
  projectsNavKey: number;
  benchmarksNavKey: number;
  isScheduledTasksOpen: boolean;
  conversations: ChatConversation[];
  onSelectView: (view: "chat") => void;
  onRestoreConversation: (id: string) => Promise<boolean>;
  onOpenArchivedConversation: (id: string) => Promise<boolean>;
  onNavigateToChat: (prompt?: string) => void;
  onCloseScheduledTasks: () => void;
  onOpenProviders: () => void;
  onOpenSkills?: () => void;
  onOpenProjects: () => void;
  onOpenPlugins: () => void;
  onOpenBenchmarks: () => void;
  onOpenArtifacts: () => void;
}

export const ChatWorkspaceScreens: React.FC<ChatWorkspaceScreensProps> = ({
  activeView,
  customizeInitialCategory,
  projectsNavKey,
  benchmarksNavKey,
  isScheduledTasksOpen,
  conversations,
  onSelectView,
  onRestoreConversation,
  onOpenArchivedConversation,
  onNavigateToChat,
  onCloseScheduledTasks,
  onOpenProviders,
  onOpenSkills,
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
            onOpenSkills={onOpenSkills}
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
    case "archived":
      screen = (
        <PageRoute
          key={activeView}
          name="Archived chats"
          fallback={<ChatScreenLoading name="Archived chats" />}
        >
          <ArchivedChatsScreen
            conversations={conversations}
            onBack={() => onSelectView("chat")}
            onRestore={onRestoreConversation}
            onOpenConversation={onOpenArchivedConversation}
          />
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
          key={`${activeView}-${benchmarksNavKey}`}
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
    case "chapters":
      screen = (
        <PageRoute
          key={activeView}
          name="Chapters"
          fallback={<ChatScreenLoading name="Chapters" />}
        >
          <ChaptersScreen onClose={() => onSelectView("chat")} />
        </PageRoute>
      );
      break;
    case "scheduled":
      screen = (
        <PageRoute
          key={activeView}
          name="Scheduled tasks"
          fallback={<ChatScreenLoading name="Scheduled tasks" />}
        >
          <ScheduledTasksScreen
            onClose={() => onSelectView("chat")}
            onNavigateToProviders={onOpenProviders}
            onNavigateToChat={onNavigateToChat}
            isEmbedded={true}
          />
        </PageRoute>
      );
      break;
    default:
      break;
  }

  return (
    <>
      {screen}
      {isScheduledTasksOpen && activeView !== "scheduled" && (
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
            isEmbedded={true}
          />
        </PageRoute>
      )}
    </>
  );
};

export default ChatWorkspaceScreens;
