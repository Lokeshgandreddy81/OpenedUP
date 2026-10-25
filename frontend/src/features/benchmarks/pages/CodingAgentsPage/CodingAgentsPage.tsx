import React from "react";
import { useNavigate } from "react-router-dom";
import { CodingAgentsView } from "../../components/coding/CodingAgentsView";
import { CodingAgentsPageErrorBoundary } from "./ErrorBoundary";

export const CodingAgentsPageContent: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/chat?view=benchmarks&tab=coding-agents");
  };

  return (
    <div className="w-screen h-screen">
      <CodingAgentsView onBackToOverview={handleBack} />
    </div>
  );
};

export const CodingAgentsPage: React.FC = () => {
  return (
    <CodingAgentsPageErrorBoundary>
      <CodingAgentsPageContent />
    </CodingAgentsPageErrorBoundary>
  );
};

export default CodingAgentsPage;
