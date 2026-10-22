import React from "react";
import { useNavigate } from "react-router-dom";
import { ChatWindow } from "../../components/chat/ChatWindow";
import { useAppContext } from "../../context/AppContext";
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

  return (
    <div className="w-screen h-screen">
      <ChatWindow
        isOpen={true}
        onClose={handleClose}
        chapters={engineOutput.computedRows}
        docTitle="Chat Assistant"
        onOpenScheduledTasks={handleOpenScheduledTasks}
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
