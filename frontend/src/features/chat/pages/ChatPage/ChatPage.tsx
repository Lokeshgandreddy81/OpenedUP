import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { AppContextType } from "../../../chapters";
import { ChatWindow } from "../../components/ChatWindow";
import type { ChatWorkspaceView } from "./ChatWorkspaceScreens";
import { ChatPageErrorBoundary } from "./ErrorBoundary";

interface ChatPageProps {
  chapters?: AppContextType["engineOutput"]["computedRows"];
}

export const ChatPageContent: React.FC<ChatPageProps> = ({ chapters = [] }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const viewParam = params.get("view");
  const validViews = [
    "chat",
    "projects",
    "artifacts",
    "customize",
    "plugins",
    "benchmarks",
    "chapters",
    "roadmaps",
    "scheduled",
    "archived",
  ];
  const initialView = validViews.includes(viewParam || "")
    ? (viewParam as ChatWorkspaceView)
    : "chat";
  const initialCustomizeCategory =
    params.get("category") === "Providers" ? "Providers" : "Connectors";

  const handleClose = () => {
    navigate("/", { replace: true });
  };

  const handleViewChange = (
    _view:
      | "chat"
      | "projects"
      | "artifacts"
      | "customize"
      | "plugins"
      | "benchmarks"
      | "chapters"
      | "roadmaps"
      | "scheduled"
      | "archived"
  ) => {
    // Keep views inside ChatWindow
  };

  return (
    <div className="w-screen h-screen">
      <ChatWindow
        isOpen={true}
        onClose={handleClose}
        chapters={chapters}
        docTitle="Chat Assistant"
        initialView={initialView}
        initialCustomizeCategory={initialCustomizeCategory}
        onViewChange={handleViewChange}
      />
    </div>
  );
};

export const ChatPage: React.FC<ChatPageProps> = ({ chapters = [] }) => {
  return (
    <ChatPageErrorBoundary>
      <ChatPageContent chapters={chapters} />
    </ChatPageErrorBoundary>
  );
};

export default ChatPage;
