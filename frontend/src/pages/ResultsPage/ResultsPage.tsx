import React from "react";
import { ResultsView } from "../../components/ResultsView";
import { useAppContext } from "../../context/AppContext";
import { ResultsPageErrorBoundary } from "./ErrorBoundary";

export const ResultsPageContent: React.FC = () => {
  const {
    photos,
    engineOutput,
    readingPhase,
    failedBatches,
    handleRetryFailedBatches,
    handleUpdateRow,
    handleChangeCostCenter,
    handleAddFiles,
    setIsWorkspaceModalOpen,
    handleNewPile,
  } = useAppContext();

  return (
    <ResultsView
      photos={photos}
      computedRows={engineOutput.computedRows}
      merchantTiles={engineOutput.merchantTiles}
      reconciliation={engineOutput.reconciliation}
      readingPhase={readingPhase}
      failedBatches={failedBatches}
      onRetryFailedBatches={handleRetryFailedBatches}
      onUpdateRow={handleUpdateRow}
      onChangeCostCenter={handleChangeCostCenter}
      onAddFiles={handleAddFiles}
      onOpenWorkspaceModal={() => setIsWorkspaceModalOpen(true)}
      onNewPile={handleNewPile}
    />
  );
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
