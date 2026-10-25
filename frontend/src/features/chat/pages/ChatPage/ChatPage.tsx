import React from "react";
import { useNavigate } from "react-router-dom";
import type { AppContextType } from "../../../chapters";
import { ChatWindow } from "../../components/ChatWindow";
import { ChatPageErrorBoundary } from "./ErrorBoundary";

interface ChatPageProps {
  chapters?: AppContextType["engineOutput"]["computedRows"];
}

export const ChatPageContent: React.FC<ChatPageProps> = ({ chapters = [] }) => {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
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
  ];
  const initialView = validViews.includes(viewParam || "") ? (viewParam as any) : "chat";
  const initialCustomizeCategory =
    params.get("category") === "Providers" ? "Providers" : "Connectors";

  const handleClose = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/results");
    }
  };

  const handleOpenScheduledTasks = () => {
    navigate("/scheduled");
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
        onOpenScheduledTasks={handleOpenScheduledTasks}
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
