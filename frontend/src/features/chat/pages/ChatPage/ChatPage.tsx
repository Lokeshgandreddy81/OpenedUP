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
    view:
      | "chat"
      | "projects"
      | "artifacts"
      | "customize"
      | "plugins"
      | "benchmarks"
      | "chapters"
      | "roadmaps"
  ) => {
    if (view === "chapters") {
      navigate("/results");
    } else if (view === "roadmaps") {
      navigate("/roadmap");
    }
  };

  return (
    <div className="w-screen h-screen">
      <ChatWindow
        isOpen={true}
        onClose={handleClose}
        chapters={chapters}
        docTitle="Chat Assistant"
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
