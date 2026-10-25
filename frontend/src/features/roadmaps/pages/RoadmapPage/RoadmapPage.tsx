import React from "react";
import { useNavigate } from "react-router-dom";
import { RoadmapsScreen } from "./RoadmapsScreen";
import { RoadmapPageErrorBoundary } from "./ErrorBoundary";

export const RoadmapPageContent: React.FC = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    navigate("/chat?view=roadmaps", { replace: true });
  }, [navigate]);

  return <RoadmapsScreen isEmbedded={true} />;
};

export const RoadmapPage: React.FC = () => {
  return (
    <RoadmapPageErrorBoundary>
      <RoadmapPageContent />
    </RoadmapPageErrorBoundary>
  );
};

export default RoadmapPage;
