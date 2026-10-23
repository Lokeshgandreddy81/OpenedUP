import React from "react";
import { useNavigate } from "react-router-dom";
import { RoadmapsScreen } from "./RoadmapsScreen";
import { RoadmapPageErrorBoundary } from "./ErrorBoundary";

export const RoadmapPageContent: React.FC = () => {
  const navigate = useNavigate();

  const handleClose = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/chat");
    }
  };

  return <RoadmapsScreen onBack={handleClose} />;
};

export const RoadmapPage: React.FC = () => {
  return (
    <RoadmapPageErrorBoundary>
      <RoadmapPageContent />
    </RoadmapPageErrorBoundary>
  );
};

export default RoadmapPage;
