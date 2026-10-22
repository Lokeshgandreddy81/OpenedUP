import React from "react";
import { useNavigate } from "react-router-dom";
import { ScheduledTasksView } from "../../components/scheduled/ScheduledTasksView";
import { ScheduledPageErrorBoundary } from "./ErrorBoundary";

export const ScheduledPageContent: React.FC = () => {
  const navigate = useNavigate();

  const handleClose = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/results");
    }
  };

  const handleNavigateToChat = (prompt?: string) => {
    navigate("/chat" + (prompt ? `?prompt=${encodeURIComponent(prompt)}` : ""));
  };

  return (
    <div className="w-screen h-screen">
      <ScheduledTasksView
        isOpen={true}
        onClose={handleClose}
        onNavigateToChat={handleNavigateToChat}
      />
    </div>
  );
};

export const ScheduledPage: React.FC = () => {
  return (
    <ScheduledPageErrorBoundary>
      <ScheduledPageContent />
    </ScheduledPageErrorBoundary>
  );
};

export default ScheduledPage;
