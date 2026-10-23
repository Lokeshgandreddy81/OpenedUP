import React from "react";
import { useNavigate } from "react-router-dom";
import { ChatWindow } from "../../components/ChatWindow";
import { useAppContext } from "../../../chapters";
import { ChatPageErrorBoundary } from "./ErrorBoundary";

export const ChatPageContent: React.FC = () => {
  const navigate = useNavigate();
  const { engineOutput } = useAppContext();

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
        chapters={engineOutput.computedRows}
        docTitle="Chat Assistant"
        onOpenScheduledTasks={handleOpenScheduledTasks}
        onViewChange={handleViewChange}
      />
    </div>
  );
};

export const ChatPage: React.FC = () => {
  return (
    <ChatPageErrorBoundary>
      <ChatPageContent />
    </ChatPageErrorBoundary>
  );
};

export default ChatPage;
