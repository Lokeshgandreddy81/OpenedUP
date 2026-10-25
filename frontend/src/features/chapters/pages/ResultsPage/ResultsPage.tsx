import React from "react";
import { useNavigate } from "react-router-dom";
import { ChatChaptersScreen } from "../ChatChaptersScreen";
import { ResultsPageErrorBoundary } from "./ErrorBoundary";
import { useAppContext } from "../../state/AppContext";

export const ResultsPageContent: React.FC = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    navigate("/chat?view=chapters", { replace: true });
  }, [navigate]);

  return <ChatChaptersScreen />;
};

export const ResultsPage: React.FC = () => {
  const { handleNewPile } = useAppContext();
  return (
    <ResultsPageErrorBoundary onReset={handleNewPile}>
      <ResultsPageContent />
    </ResultsPageErrorBoundary>
  );
};

export default ResultsPage;
